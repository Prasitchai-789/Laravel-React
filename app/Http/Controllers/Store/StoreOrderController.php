<?php

namespace App\Http\Controllers\Store;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\StoreItem;
use App\Models\StoreOrder;
use App\Models\WIN\EMGood;
use App\Models\OrderProduct;
use Illuminate\Http\Request;
use App\Models\StoreMovement;
use App\Models\WIN\ICStockDT;
use App\Models\WIN\ICStockHD;
use App\Models\StoreOrderItem;
use App\Models\WIN\EMGoodUnit;
use App\Models\WIN\ICStockDetail;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;


class StoreOrderController extends Controller
{

    public function index(Request $request)
    {
        $goodCode = $request->query('search');
        $storeItems = StoreItem::when($goodCode, fn($q) => $q->where('good_code', $goodCode))->get();
        // dd($storeItems);

        // โหลด unit ทั้งหมด
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string)$u->GoodUnitID);

        // โหลดชื่อและหน่วยสินค้าจาก EMGood
        $goodInfos = DB::connection('sqlsrv2')
            ->table('EMGood as g')
            ->leftJoin('EMGoodUnit as u', 'g.MainGoodUnitID', '=', 'u.GoodUnitID')
            ->select('g.GoodCode', 'g.GoodName1', 'g.MainGoodUnitID', 'u.GoodUnitName')
            ->get()
            ->map(fn($item) => (object)[
                'GoodName1' => $item->GoodName1 ?? null,
                'MainGoodUnitID' => $item->MainGoodUnitID ?? null,
                'GoodUnitName' => $item->GoodUnitName ?? null,
                'GoodCode' => strtoupper(trim($item->GoodCode))
            ])
            ->keyBy(fn($g) => $g->GoodCode);

        // โหลด movement ของสินค้าทั้งหมด
        $movementsGrouped = StoreMovement::with('storeOrder')
            ->whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        $goods = $storeItems->map(function ($item) use ($goodInfos, $movementsGrouped, $goodUnits) {
            $info = $goodInfos->get(strtoupper(trim($item->good_code)));

            $goodName = $info?->GoodName1 ?? $item->GoodName ?? 'ไม่ระบุ';

            $unitName = $info?->GoodUnitName
                ?? ($info?->MainGoodUnitID && isset($goodUnits[(string)$info->MainGoodUnitID])
                    ? $goodUnits[(string)$info->MainGoodUnitID]->GoodUnitName
                    : 'ชิ้น');

            $movements = $movementsGrouped->get($item->id, collect());

            // เริ่มต้นด้วย stock จริงจาก database
            $stockQty = floatval($item->stock_qty);
            $safetyStock = floatval($item->safety_stock);
            $reservedQty = 0;

            \Log::info('🔄 Starting calculation for product: ' . $item->good_code, [
                'initial_stock' => $stockQty,
                'initial_safety_stock' => $safetyStock
            ]);

            // 🔹 คำนวณ stock / reserved ตาม approved/pending - แก้ไขให้ถูกต้องแล้ว!
            foreach ($movements as $m) {
                $quantity = floatval($m->quantity);

                \Log::info('📊 Processing movement:', [
                    'good_code' => $item->good_code,
                    'movement_id' => $m->id,
                    'movement_type' => $m->movement_type,
                    'type' => $m->type,
                    'status' => $m->status,
                    'quantity' => $quantity,
                    'before_stock' => $stockQty,
                    'before_reserved' => $reservedQty
                ]);

                if ($m->movement_type === 'issue') {
                    if ($m->type === 'subtract') {
                        if ($m->status === 'pending') {
                            // 📌 pending issue subtract → เพิ่ม reserved (จองสินค้า)
                            $reservedQty += $quantity;
                            \Log::info('➕ Added to reserved from pending issue subtract', ['new_reserved' => $reservedQty]);
                        } elseif ($m->status === 'approved') {
                            // 📌 approved issue subtract → ลด stock (เบิกสินค้าจริง)
                            $stockQty -= $quantity;
                            \Log::info('➖ Subtracted from stock from approved issue subtract', ['new_stock' => $stockQty]);
                        }
                        // rejected issue subtract → ไม่ต้องทำอะไร
                    } elseif ($m->type === 'add') {
                        if ($m->status === 'pending') {
                            // 📌 pending issue add → ลด reserved (ยกเลิกการจอง)
                            $reservedQty = max(0, $reservedQty - $quantity);
                            \Log::info('🔻 Reduced reserved from pending issue add', [
                                'quantity' => $quantity,
                                'new_reserved' => $reservedQty
                            ]);
                        } elseif ($m->status === 'approved') {
                            // 📌 approved issue add → เพิ่ม stock (คืนสินค้า)
                            $stockQty += $quantity;
                            \Log::info('📥 Added to stock from approved issue add', [
                                'quantity' => $quantity,
                                'new_stock' => $stockQty
                            ]);
                        }
                        // rejected issue add → ไม่ต้องทำอะไร
                    }
                } elseif ($m->movement_type === 'return' && $m->status === 'approved') {
                    // 📌 return approved → เพิ่ม stock (คืนสินค้า)
                    $stockQty += $quantity;
                    \Log::info('📥 Added to stock from return', ['new_stock' => $stockQty]);
                } elseif ($m->movement_type === 'adjustment' && $m->status === 'approved') {
                    // 📌 adjustment → เพิ่ม/ลด stock ตาม type
                    if ($m->type === 'add') {
                        $stockQty += $quantity;
                        \Log::info('📈 Added to stock from adjustment', ['new_stock' => $stockQty]);
                    } else {
                        $stockQty -= $quantity;
                        \Log::info('📉 Subtracted from stock from adjustment', ['new_stock' => $stockQty]);
                    }
                } elseif ($m->movement_type === 'receipt' && $m->status === 'approved') {
                    // 📌 receipt → เพิ่ม stock (รับสินค้าเข้า)
                    if ($m->type === 'add') {
                        $stockQty += $quantity;
                        \Log::info('📦 Added to stock from receipt', ['new_stock' => $stockQty]);
                    }
                }

                \Log::info('✅ After movement processing:', [
                    'good_code' => $item->good_code,
                    'movement_id' => $m->id,
                    'after_stock' => $stockQty,
                    'after_reserved' => $reservedQty,
                    'calculated_available' => max($stockQty - $reservedQty, 0)
                ]);
            }

            $reservedQty = max($reservedQty, 0);
            $availableQty = max($stockQty - $reservedQty, 0);

            \Log::info('🎉 Final calculation for product: ' . $item->good_code, [
                'final_stock' => $stockQty,
                'final_reserved' => $reservedQty,
                'final_available' => $availableQty,
                'safety_stock' => $safetyStock
            ]);

            return [
                'GoodID' => $item->good_id,
                'GoodCode' => $item->good_code,
                'GoodName' => $goodName,
                'GoodStockUnitName' => $unitName,
                'stock_qty' => $stockQty,
                'safety_stock' => $safetyStock,
                'reservedQty' => $reservedQty,
                'availableQty' => $availableQty,
                'price' => $item->price,
                'movements_count' => $movements->count(),
                'initial_stock' => $item->stock_qty,
                'movements_debug' => $movements->map(fn($m) => [
                    'id' => $m->id,
                    'movement_type' => $m->movement_type,
                    'type' => $m->type,
                    'status' => $m->status,
                    'quantity' => floatval($m->quantity)
                ])->toArray()
            ];
        });

        return Inertia::render('Store/OrderIndex', [
            'goods' => $goods,
            'selectedGoodCode' => $goodCode,
        ]);
    }

    public function show(StoreOrder $order)
    {
        // โหลดความสัมพันธ์ด้วยถ้าจำเป็น
        $order->load('items');

        return Inertia::render('Store/StoreOrderShow', [
            'order' => $order,
        ]);
    }

    public function StoreIssueIndex()
    {
        $page = request()->get('page', 1);
        $perPage = 12;

        $source = request()->get('source', 'WEB');
        $search = request()->get('search', '');
        $status = request()->get('status', '');
        $dailyDate = request()->get('dailyDate', '');

        if ($source === 'WIN') {
            return $this->getWinOrders($page, $perPage, $search, $status, $dailyDate);
        } else {
            return $this->getWebOrders($page, $perPage, $search, $status, $dailyDate);
        }
    }

    private function getWinOrders($page, $perPage, $search, $status, $dailyDate)
    {
        $winOrders = DB::connection('sqlsrv2')
            ->table('ICStockHD as hd')
            ->join('ICStockDT as dt', 'hd.DocuID', '=', 'dt.DocuID')
            ->select(
                'hd.DocuID as document_id',
                'hd.DocuNo as document_number',
                'hd.DocuDate as order_date',
                'dt.ListNo',
                'dt.GoodName as product_name',
                'dt.DocuType as product_type',
                DB::raw('CAST(dt.GoodStockQty AS decimal(18,2)) as stock_qty'),
                DB::raw('CAST(dt.GoodRemaQty1 AS decimal(18,2)) as reserved_qty'),
                DB::raw('(CAST(dt.GoodStockQty AS decimal(18,2)) - CAST(dt.GoodRemaQty1 AS decimal(18,2))) as remaining_qty')
            )
            ->orderBy('hd.DocuDate', 'desc');

        // เพิ่มการค้นหาใน WIN system
        if (!empty($search)) {
            $winOrders->where(function ($query) use ($search) {
                $query->where('hd.DocuNo', 'like', '%' . $search . '%')
                    ->orWhere('dt.GoodName', 'like', '%' . $search . '%');
            });
        }

        // กรองตามวันที่
        if (!empty($dailyDate)) {
            $winOrders->whereDate('hd.DocuDate', $dailyDate);
        }

        // นับจำนวนทั้งหมดก่อนแบ่งหน้า
        $total = $winOrders->count();

        // ดึงข้อมูลตามหน้า
        $winOrders = $winOrders
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $allOrders = collect();

        $winOrders->groupBy('document_id')->each(function ($items, $docId) use ($allOrders) {
            $first = $items->first();
            $allOrders->push([
                'id' => $docId,
                'document_number' => $first->document_number,
                'order_date' => \Carbon\Carbon::parse($first->order_date),
                'status' => 'รออนุมัติ',
                'source' => 'WIN',
                'items' => $items->map(function ($item) {
                    return [
                        'id' => $item->ListNo,
                        'product_name' => $item->product_name,
                        'product_type' => $item->product_type,
                        'stock_qty' => $item->stock_qty,
                        'reserved_qty' => $item->reserved_qty,
                        'remaining_qty' => $item->remaining_qty,
                    ];
                })->values(),
            ]);
        });

        $paginatedOrders = new LengthAwarePaginator(
            $allOrders,
            $total,
            $perPage,
            $page,
            [
                'path' => request()->url(),
                'query' => array_merge(request()->query(), ['source' => 'WIN'])
            ]
        );

        return Inertia::render('Store/StoreIssueIndex', [
            'orders' => $paginatedOrders->items(),
            'pagination' => $paginatedOrders,
        ]);
    }

    private function getWebOrders($page, $perPage, $search, $status, $dailyDate)
    {
        // 1️⃣ โหลด orders + items - เรียงตามวันที่ใหม่ก่อน
        $webOrdersQuery = StoreOrder::with(['items'])
            ->orderBy('order_date', 'desc')
            ->orderBy('id', 'desc');

        // 2️⃣ ถ้ามี search
        if (!empty($search)) {
            // 🔹 ดึง GoodID ที่ตรงกับ search จาก EMGood
            $goodIds = DB::connection('sqlsrv2')
                ->table('EMGood')
                ->where('GoodName1', 'like', "%{$search}%")
                ->orWhere('GoodCode', 'like', "%{$search}%")
                ->pluck('GoodID')
                ->toArray();

            $webOrdersQuery->where(function ($query) use ($search, $goodIds) {
                $query->where('document_number', 'like', "%{$search}%")
                    ->orWhereHas('items', function ($q) use ($goodIds) {
                        // filter order items ที่ product_id อยู่ใน goodIds
                        $q->whereIn('product_id', $goodIds);
                    });
            });
        }

        // 3️⃣ filter status
        if (!empty($status)) {
            $webOrdersQuery->where('status', $status);
        }

        // 4️⃣ filter daily date
        if (!empty($dailyDate)) {
            $webOrdersQuery->whereDate('order_date', $dailyDate);
        }

        $total = $webOrdersQuery->count();

        $webOrders = $webOrdersQuery
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // 5️⃣ โหลด EMGoodUnit
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string)$u->GoodUnitID);

        // 6️⃣ โหลด EMGood ของสินค้าทั้งหมดใน orders
        $goodIds = $webOrders->flatMap(fn($o) => $o->items->pluck('product_id'))->unique()->toArray();
        $goods = DB::connection('sqlsrv2')
            ->table('EMGood')
            ->select('GoodID', 'GoodName1', 'MainGoodUnitID', 'GoodCode')
            ->whereIn('GoodID', $goodIds)
            ->get()
            ->keyBy('GoodID');

        // 7️⃣ โหลด employee list
        $employees = DB::connection('sqlsrv2')->table('Webapp_Emp')->pluck('EmpName', 'EmpID');

        // 8️⃣ map orders + items + movements
        $allOrders = $webOrders->map(function ($order) use ($goodUnits, $goods, $employees) {
            $productIds = $order->items->pluck('product_id')->toArray();
            $storeItemsMap = DB::table('store_items')->whereIn('good_id', $productIds)->pluck('id', 'good_id');

            $orderMovements = StoreMovement::with('user')->where('store_order_id', $order->id)->get()->groupBy('store_item_id');

            $items = $order->items->map(function ($item) use ($orderMovements, $storeItemsMap, $goodUnits, $goods, $employees) {
                $storeItemId = $storeItemsMap[$item->product_id] ?? null;
                $itemMovements = $storeItemId ? $orderMovements->get($storeItemId, collect()) : collect();

                $history = $itemMovements->map(function ($m) use ($employees, $item) {
                    $empName = $m->user?->employee_id ? ($employees[$m->user->employee_id] ?? $m->user->name) : ($m->user?->name ?? 'ไม่ระบุ');
                    return [
                        'movement_type' => $m->movement_type == 'return' ? 'คืน' : 'เบิก',
                        'quantity' => $m->quantity,
                        'docu_no' => $m->store_order_id ? 'SO-' . $m->store_order_id : $m->id,
                        'docu_date' => $m->created_at ?? '-',
                        'user_id' => $empName,
                        'product_id' => $item->product_id,
                        'status' => $m->status,
                        'type' => $m->type,
                    ];
                })->sortBy('docu_date')->values();

                // pending
                $totalIssuedSubtract = $itemMovements->where('movement_type', 'issue')->where('type', 'subtract')->sum('quantity');
                $totalIssuedAdd = $itemMovements->where('movement_type', 'issue')->where('type', 'add')->sum('quantity');
                $netIssuedQuantity = max($totalIssuedSubtract - $totalIssuedAdd, 0);
                $pendingQty = max($item->quantity - $netIssuedQuantity, 0);

                $itemGood = $goods[$item->product_id] ?? null;
                $unitName = $itemGood ? ($goodUnits[(string)$itemGood->MainGoodUnitID]->GoodUnitName ?? '-') : '-';

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'store_item_id' => $storeItemId,
                    'product_name' => $item->good?->GoodName1 ?? $itemGood?->GoodName1 ?? '-',
                    'product_code' => $item->good?->GoodCode ?? $itemGood?->GoodCode ?? $item->product_id,
                    'quantity' => $item->quantity,
                    'unit' => $unitName,
                    'history' => $history,
                    'pendingQty' => $pendingQty,
                    'totalIssued' => $netIssuedQuantity,
                    'movements_count' => $itemMovements->count(),
                ];
            });

            return [
                'id' => $order->id,
                'document_number' => $order->document_number,
                'order_date' => $order->order_date ? date('Y-m-d H:i:s', strtotime($order->order_date)) : date('Y-m-d H:i:s'),
                'status' => $order->status ?? 'รออนุมัติ',
                'department' => $order->department ?? '-',
                'requester' => $order->requester ?? '-',
                'source' => 'WEB',
                'items' => $items,
                'movements_count' => $orderMovements->flatten()->count(),

            ];
        });

        $paginatedOrders = new \Illuminate\Pagination\LengthAwarePaginator(
            $allOrders,
            $total,
            $perPage,
            $page,
            [
                'path' => request()->url(),
                'query' => array_merge(request()->query(), ['source' => 'WEB']),
            ]
        );

        return \Inertia\Inertia::render('Store/StoreIssueIndex', [
            'orders' => $paginatedOrders->items(),
            'pagination' => $paginatedOrders,
            'userRole' => auth()->user()->role ?? '',
        ]);
    }


    public function destroy($id)
    {
        DB::connection('sqlsrv2')->transaction(function () use ($id) {
            // ลบรายละเอียด
            ICStockDetail::where('DocuID', $id)->delete();
            // ลบรายการสินค้า
            ICStockDT::where('DocuID', $id)->delete();
            // ลบหัวเอกสาร
            ICStockHD::where('DocuID', $id)->delete();
        });

        return response()->json(['success' => true]);
    }

    public function store(Request $request)
    {
        try {
            \Log::info('StoreOrder request received', $request->all());

            $data = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.good_id' => 'required',
                'items.*.qty' => 'required|numeric|min:0',
                'note' => 'nullable|string',
                'withdraw_date' => 'required|date',
            ]);

            \Log::info('Validation passed', $data);

            $order = null;

            DB::transaction(function () use ($data, &$order) {
                $user = Auth::user();
                \Log::info('User info', ['user_id' => $user->id, 'employee_id' => $user->employee_id]);

                $employeeId = $user->employee_id;
                $departmentName = 'ไม่ระบุ';
                $empName = 'ไม่พบข้อมูลพนักงาน';

                // ดึงข้อมูลพนักงาน
                if (!empty($employeeId)) {
                    try {
                        $employee = DB::connection('sqlsrv2')
                            ->table('dbo.Webapp_Emp')
                            ->select('EmpName', 'DeptID')
                            ->where('EmpID', $employeeId)
                            ->first();

                        if ($employee) {
                            $empName = $employee->EmpName ?? 'ไม่ระบุชื่อ';
                            if (!empty($employee->DeptID)) {
                                $departmentName = DB::connection('sqlsrv2')
                                    ->table('dbo.Webapp_Dept')
                                    ->where('DeptID', $employee->DeptID)
                                    ->value('DeptName') ?? 'ไม่ระบุแผนก';
                            }
                        }
                    } catch (\Exception $e) {
                        \Log::error('Error fetching employee data', ['error' => $e->getMessage()]);
                    }
                }

                // วันที่เบิก
                $orderDate = $data['withdraw_date']
                    ? \Carbon\Carbon::parse($data['withdraw_date'])
                    : now();

                // ✅ สร้าง order ครั้งเดียว
                $order = new \App\Models\StoreOrder([
                    'document_number' => 'SO-' . now()->format('YmdHis'),
                    'order_date' => $orderDate,
                    'status' => 'pending',
                    'department' => $departmentName,
                    'requester' => $empName,
                    'note' => $data['note'] ?? null,
                ]);

                $order->created_at = $orderDate;
                $order->updated_at = $orderDate;
                $order->save();

                \Log::info('Order created', ['order_id' => $order->id, 'document_number' => $order->document_number]);

                // ✅ ประมวลผล items
                foreach ($data['items'] as $index => $item) {
                    \Log::info('Processing item', ['index' => $index, 'item' => $item]);

                    $storeItem = \App\Models\StoreItem::where('good_id', $item['good_id'])->first();

                    if (!$storeItem) {
                        throw new \Exception("ไม่พบสินค้า ID: {$item['good_id']}");
                    }

                    // ✅ เพิ่มรายการสินค้าภายใต้ order เดิม
                    // เพิ่มรายการสินค้าภายใต้ order เดิม
                    $orderItem = $order->items()->make([
                        'product_id' => $item['good_id'],
                        'quantity' => $item['qty'],
                    ]);

                    $orderItem->timestamps = false; // ปิด auto timestamps
                    $orderItem->created_at = $orderDate;
                    $orderItem->updated_at = $orderDate;
                    $orderItem->save();


                    // ✅ สร้าง movement
                    $movement = new \App\Models\StoreMovement([
                        'store_item_id' => $storeItem->id,
                        'user_id' => $user->id,
                        'movement_type' => 'issue',
                        'category' => 'stock',
                        'type' => 'subtract',
                        'quantity' => $item['qty'],
                        'note' => "Order {$order->document_number}" . (!empty($data['note']) ? " - {$data['note']}" : ""),
                        'store_order_id' => $order->id,
                        'status' => 'pending',
                    ]);

                    $movement->created_at = $orderDate;
                    $movement->updated_at = $orderDate;
                    $movement->save();

                    \Log::info('Movement created', [
                        'store_item_id' => $storeItem->id,
                        'created_at' => $movement->created_at
                    ]);
                }
            });

            \Log::info('Transaction completed successfully');

            return redirect()->route('Store.index')->with([
                'success' => true,
                'message' => '✅ ทำการบันทึกคำสั่งเบิกเรียบร้อย รออนุมัติ',
                'order_id' => $order->id,
                'document_number' => $order->document_number
            ]);
        } catch (\Exception $e) {
            \Log::error('StoreOrder error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors([
                'error' => 'เกิดข้อผิดพลาดในการบันทึก: ' . $e->getMessage()
            ]);
        }
    }

    public function confirm($orderId)
    {
        $order = StoreOrder::findOrFail($orderId);

        // ทำการ confirm order ที่นี่
        $order->update(['status' => 'อนุมัติแล้ว']);

        return Inertia::render('Store/StoreOrder', [
            'order' => $order,
            'message' => '✅ ทำการเบิกและยืนยันสำเร็จ',
        ]);
    }

    public function storeOrder()
    {
        // 1️⃣ ดึง store_items ทั้งหมด
        $storeItems = StoreItem::all();

        // 2️⃣ โหลด EMGoodUnit จาก SQL Server
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string)$u->GoodUnitID);

        // 3️⃣ โหลดชื่อสินค้าและหน่วยจาก EMGood
        $goodInfos = DB::connection('sqlsrv2')
            ->table('EMGood as g')
            ->leftJoin('EMGoodUnit as u', 'g.MainGoodUnitID', '=', 'u.GoodUnitID')
            ->select('g.GoodCode', 'g.GoodName1', 'g.MainGoodUnitID', 'u.GoodUnitName')
            ->get()
            ->map(fn($item) => (object)[
                'GoodCode' => strtoupper(trim($item->GoodCode)),
                'GoodName1' => $item->GoodName1 ?? null,
                'MainGoodUnitID' => $item->MainGoodUnitID ?? null,
                'GoodUnitName' => $item->GoodUnitName ?? null,
            ])
            ->keyBy(fn($g) => $g->GoodCode);

        // 4️⃣ โหลด movement ของสินค้าทั้งหมด
        $movementsGrouped = StoreMovement::whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        // 5️⃣ รวมข้อมูลและคำนวณ stock / reserved / available
        $goods = $storeItems->map(function ($item) use ($goodInfos, $movementsGrouped, $goodUnits) {
            $info = $goodInfos->get(strtoupper(trim($item->good_code)));

            $goodName = $info?->GoodName1 ?? $item->GoodName ?? 'ไม่ระบุ';

            $unitName = $info?->GoodUnitName
                ?? ($info?->MainGoodUnitID && isset($goodUnits[(string)$info->MainGoodUnitID])
                    ? $goodUnits[(string)$info->MainGoodUnitID]->GoodUnitName
                    : 'ชิ้น');

            $movements = $movementsGrouped->get($item->id, collect());

            $stockQty = floatval($item->stock_qty);
            $safetyStock = floatval($item->safety_stock);
            $reservedQty = 0;

            foreach ($movements as $m) {
                $quantity = floatval($m->quantity);

                if ($m->status === 'rejected') continue;

                if ($m->movement_type === 'issue') {
                    if ($m->type === 'subtract') {
                        if ($m->status === 'pending') $reservedQty += $quantity;
                        elseif ($m->status === 'approved') $stockQty -= $quantity;
                    } elseif ($m->type === 'add') {
                        if ($m->status === 'pending') $reservedQty = max(0, $reservedQty - $quantity);
                        elseif ($m->status === 'approved') $stockQty += $quantity;
                    }
                } elseif ($m->movement_type === 'return' && $m->status === 'approved') {
                    $stockQty += $quantity;
                } elseif ($m->movement_type === 'adjustment' && $m->status === 'approved') {
                    $stockQty += $m->type === 'add' ? $quantity : -$quantity;
                } elseif ($m->movement_type === 'receipt' && $m->status === 'approved') {
                    if ($m->type === 'add') $stockQty += $quantity;
                }
            }

            $reservedQty = max(0, $reservedQty);
            $availableQty = max($stockQty - $reservedQty, 0);

            return [
                'GoodID' => $item->good_id,
                'GoodCode' => $item->good_code,
                'GoodName' => $goodName,
                'GoodStockUnitName' => $unitName,
                'stock_qty' => $stockQty,
                'safety_stock' => $safetyStock,
                'reservedQty' => $reservedQty,
                'availableQty' => $availableQty,
                'price' => $item->price,
                'movements_count' => $movements->count(),
            ];
        });

        return Inertia::render('Store/StoreOrder', [
            'goods' => $goods,
        ]);
    }

    public function confirmOrder(StoreOrder $order)
    {
        try {
            if ($order->status === 'ยืนยันแล้ว') {
                return response()->json([
                    'message' => 'คำสั่งเบิกนี้ถูกยืนยันแล้ว'
                ], 400);
            }

            DB::transaction(function () use ($order) {
                // 1. เปลี่ยนสถานะคำสั่งเบิก
                $order->status = 'ยืนยันแล้ว';
                $order->confirmed_at = now();
                $order->save();

                // 2. อัพเดต stock ใน SQL Server
                foreach ($order->items as $item) {
                    DB::connection('sqlsrv2')->table('ICStockDetail')
                        ->where('GoodID', $item->good_id)
                        ->decrement('GoodStockQty', $item->qty); // ลดจำนวน stock
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'ยืนยันคำสั่งเบิกสำเร็จ',
                'order' => $order
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, StoreOrder $order)
    {
        $status = strtolower($request->input('status', $request->status));
        $request->merge(['status' => $status]);

        $request->validate([
            'status' => 'required|string|in:pending,approved,rejected',
        ]);

        $user = auth()->user();
        $employeeName = $user->name ?? $user->id;

        if (!empty($user->employee_id)) {
            $employee = DB::connection('sqlsrv2')
                ->table('dbo.Webapp_Emp')
                ->select('EmpName')
                ->where('EmpID', $user->employee_id)
                ->first();
            if ($employee) $employeeName = $employee->EmpName ?? $employeeName;
        }

        DB::transaction(function () use ($order, $status, $employeeName) {
            // อัปเดต status ของ order
            $order->status = $status;
            $order->user_approved = in_array($status, ['approved', 'rejected']) ? $employeeName : null;
            $order->save();

            if ($status === 'rejected') {
                // ดึง movement ทั้งหมดของ order ที่ยังไม่ rejected
                $movements = DB::table('store_movements')
                    ->where('store_order_id', $order->id)
                    ->where('status', '!=', 'rejected')
                    ->get();

                foreach ($movements as $m) {
                    // ✅ เอาการปรับ stock โดยตรงออกทั้งหมด!
                    // ให้ Backend index คำนวณ stock จาก movements ที่มี status = rejected

                    // ✅ แค่เปลี่ยน status ของ movement เป็น rejected เท่านั้น
                    DB::table('store_movements')
                        ->where('id', $m->id)
                        ->update([
                            'status' => 'rejected',
                            'updated_at' => now(),
                        ]);
                }
            } elseif ($status === 'approved') {
                // ดึง movement ทั้งหมดของ order ที่ยังไม่ approved
                $movements = DB::table('store_movements')
                    ->where('store_order_id', $order->id)
                    ->where('status', '!=', 'approved')
                    ->get();

                foreach ($movements as $m) {
                    // ✅ แค่เปลี่ยน status ของ movement เป็น approved เท่านั้น
                    DB::table('store_movements')
                        ->where('id', $m->id)
                        ->update([
                            'status' => 'approved',
                            'updated_at' => now(),
                        ]);
                }
            }
        });

        return redirect()->back()->with('success', 'อัปเดตสถานะเรียบร้อยแล้ว');
    }

    public function showQRCode($order)
    {
        // ดึง store_item จาก MySQL
        $storeItem = StoreItem::where('good_id', $order)->first();



        if (!$storeItem)
            abort(404);

        // ดึงชื่อสินค้า จาก EMGood
        $goodName = DB::connection('sqlsrv2')
            ->table('EMGood')
            ->where('GoodCode', $storeItem->good_code)
            ->value('GoodName1') ?? 'ไม่ระบุ';

        // ดึงชื่อหน่วย จาก EMGoodUnit
        $unitName = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->where('GoodUnitID', $storeItem->GoodUnitID)
            ->value('GoodUnitName') ?? 'ชิ้น';

        // สร้าง object ส่งไป React
        $product = (object) [
            'GoodID' => $storeItem->good_id,
            'GoodCode' => $storeItem->good_code,
            'GoodName' => $goodName,
            'GoodStockUnitName' => $unitName,
            'stock_qty' => $storeItem->stock_qty,
            'safety_stock' => $storeItem->safety_stock,
            'price' => $storeItem->price,
        ];

        return Inertia::render('Store/QRCode', [
            'product' => $product,
        ]);
    }

    public function return(Request $request)
    {

        // dd($request);
        $request->validate([
            'document_number' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:store_order_items,id',
            'items.*.store_item_id' => 'required|exists:store_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        $order = StoreOrder::where('document_number', $request->document_number)->firstOrFail();

        foreach ($request->items as $itemData) {
            // ดึง order item
            $orderItem = $order->items()->where('id', $itemData['product_id'])->first();
            if (!$orderItem) continue;

            // ดึง store item
            $storeItem = StoreItem::find($itemData['store_item_id']);
            if (!$storeItem) continue;

            $borrowedQty = floatval($orderItem->quantity);

            // จำนวนที่คืนแล้วก่อนหน้านี้
            $alreadyReturned = floatval(StoreMovement::where('store_order_id', $order->id)
                ->where('store_item_id', $storeItem->id)
                ->where('movement_type', 'return')
                ->where('status', 'approved')
                ->sum('quantity'));

            // จำนวนที่เหลือให้คืน
            $remainingToReturn = $borrowedQty - $alreadyReturned;

            // ถ้าคืนเกินจำนวนที่เหลือ ให้ปรับเป็นจำนวนสูงสุดที่คืนได้
            $returnQty = min(floatval($itemData['quantity']), $remainingToReturn);

            if ($returnQty <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => "สินค้านี้คืนครบแล้ว หรือจำนวนคืนเกินที่เบิกไป"
                ], 422);
            }

            // สร้าง movement
            $movement = StoreMovement::create([
                'store_item_id' => $storeItem->id,
                'store_order_id' => $order->id,
                'movement_type' => 'return',
                'type' => 'add',
                'category' => $itemData['category'] ?? 'stock',
                'quantity' => $returnQty,
                'note' => $itemData['note'] ?? "คืนจาก Order {$order->document_number}",
                'user_id' => auth()->id(),
                'status' => 'approved',
            ]);
        }


        // SO-20251001034442
        // ST-EQ-AE002

        return redirect()->back()->with('success', '✅ คืนสินค้าสำเร็จ');
    }

    public function documents()
    {
        $documents = StoreOrder::with(['items:id,store_order_id,good_id,good_name,quantity,unit'])
            ->select('id', 'document_number', 'order_date', 'status')
            ->get();

        $data = $documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'document_number' => $doc->document_number,
                'order_date' => $doc->order_date,
                'status' => $doc->status,
                'items' => $doc->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'good_id' => $item->good_id,
                        'good_name' => $item->good_name,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                    ];
                }),
            ];
        });

        return response()->json($data);
    }

    // ถ้าต้องการ method สำหรับดึงแค่รายการสินค้าของ document เดี่ยว
    public function items($documentNumber)
    {


        try {
            $order = StoreOrder::where('document_number', $documentNumber)->firstOrFail();

            $orderItems = $order->items()->with('good')->get();

            $items = $orderItems->map(function ($item) use ($order) {

                $storeItem = StoreItem::where('good_id', $item->product_id)->first();


                $returnedQty = 0;

                if ($storeItem) {
                    $returnedQty = StoreMovement::where('store_order_id', $order->id)
                        ->where('store_item_id', $storeItem->id)
                        ->where('movement_type', 'return')
                        ->where('status', 'approved')
                        ->sum('quantity');
                }

                $borrowedQty = $item->quantity ?? 0;
                $remainingQty = max($borrowedQty - $returnedQty, 0);

                return [
                    'id' => $item->id,
                    'store_item_id' => $storeItem?->id ?? null,
                    'good_id' => $item->good?->GoodID ?? null,      // ✅ เอารหัสสินค้าจริงจาก relation good
                    'good_name' => $item->good?->GoodName1 ?? $item->good_name ?? 'Unknown',
                    'borrowed_quantity' => $item->quantity ?? 0,
                    'returned_quantity' => $returnedQty,
                    'remaining_quantity' => max(($item->quantity ?? 0) - $returnedQty, 0),
                    'current_stock' => $storeItem?->stock_qty ?? 0,
                    'unit' => $item->unit ?? $item->good?->GoodUnit ?? '',
                ];
            });

            return response()->json(['items' => $items]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'ไม่พบเอกสาร'], 404);
        } catch (\Throwable $e) {
            \Log::error('StoreOrder items error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Internal Server Error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function detail($id)
    {
        $order = StoreOrder::with('items.history')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }
        return response()->json($order);
    }

    public function searchNew(Request $request)
    {
        $query = $request->input('query', '');

        // Subquery: ราคาล่าสุดจาก ICStockDetail (1 แถวต่อ GoodID)
        $latestPriceSub = DB::connection('sqlsrv2')
            ->table('ICStockDetail as s1')
            ->select('s1.GoodID', 's1.GoodUnitID2', 's1.GoodPrice2', 's1.DocuDate')
            ->whereRaw('s1.DocuDate = (
            SELECT MAX(s2.DocuDate)
            FROM ICStockDetail s2
            WHERE s2.GoodID = s1.GoodID
        )');

        // ดึงข้อมูลสินค้าจากฐาน sqlsrv2
        $goods = DB::connection('sqlsrv2')
            ->table('EMGood as g')
            ->leftJoinSub($latestPriceSub, 's', 'g.GoodID', '=', 's.GoodID')
            ->where(function ($q) {
                $q->whereNull('g.Inactive')->orWhere('g.Inactive', '!=', '1');
            })
            ->when($query, function ($q) use ($query) {
                $q->where(function ($w) use ($query) {
                    $w->where('g.GoodCode', 'like', "%{$query}%")
                        ->orWhere('g.GoodName1', 'like', "%{$query}%");
                });
            })
            ->select([
                'g.GoodCode',
                'g.GoodID',
                'g.GoodName1',
                's.GoodUnitID2',
                's.GoodPrice2',
                's.DocuDate',
            ])
            ->orderBy('g.GoodCode')
            ->limit(50)
            ->get();

        // ดึงข้อมูล stock จากฐาน sqlsrv
        $storeItems = DB::connection('sqlsrv')
            ->table('store_items')
            ->select(
                'good_id',
                'good_code',
                DB::raw('SUM(stock_qty) as stock_qty'),
                DB::raw('SUM(safety_stock) as safety_stock')
            )
            ->groupBy('good_id', 'good_code')
            ->get()
            ->keyBy(fn($i) => "{$i->good_id}-{$i->good_code}");

        // รวมข้อมูลทั้งสองฝั่ง
        foreach ($goods as $good) {
            $key = "{$good->GoodID}-{$good->GoodCode}";
            $item = $storeItems[$key] ?? null;

            $good->stock_qty = $item->stock_qty ?? 0;
            $good->safety_stock = $item->safety_stock ?? 0;
            $good->status = ($good->stock_qty > 0 || $good->safety_stock > 0)
                ? '✅ มีอยู่แล้วใน store_items'
                : '➕ ยังไม่มีใน store_items';
        }

        return response()->json($goods);
    }

    public function importNew(Request $request)
    {
        \Log::info('Import request received', $request->all());

        $goods = $request->input('goods', []);

        $saved = [];
        $exists = [];

        foreach ($goods as $good) {
            // ใช้ key ตรงกับที่ React ส่ง
            $goodId = $good['GoodID'] ?? null;
            $goodCode = $good['GoodCode'] ?? null;

            if (!$goodId || !$goodCode) {
                continue; // ข้าม item ที่ไม่มี GoodID หรือ GoodCode
            }

            $found = DB::table('store_items')
                ->where('good_id', $goodId)
                ->where('good_code', $goodCode)
                ->first();

            if ($found) {
                $exists[] = $good;
                continue;
            }

            $id = DB::table('store_items')->insertGetId([
                'good_id' => $goodId,
                'good_code' => $goodCode,
                'GoodUnitID' => $good['GoodUnitID2'] ?? null,
                'stock_qty' => $good['inputStockQty'] ?? 0,
                'safety_stock' => $good['inputSafetyStock'] ?? 0,
                'price' => $good['GoodPrice2'] ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $saved[] = $good;
        }

        return response()->json([
            'saved' => $saved,
            'exists' => $exists,
            'message' => 'Import finished'
        ]);
    }

    public function getStockInfo(Request $request)
    {
        $goodCodes = $request->query('good_codes', []);
        if (is_string($goodCodes)) {
            $goodCodes = explode(',', $goodCodes);
        }

        $storeItems = StoreItem::whereIn('good_code', $goodCodes)->get();

        // โหลด unit ทั้งหมด
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string)$u->GoodUnitID);

        // โหลดชื่อและหน่วยสินค้าจาก EMGood
        $goodInfos = DB::connection('sqlsrv2')
            ->table('EMGood as g')
            ->leftJoin('EMGoodUnit as u', 'g.MainGoodUnitID', '=', 'u.GoodUnitID')
            ->select('g.GoodCode', 'g.GoodName1', 'g.MainGoodUnitID', 'u.GoodUnitName')
            ->get()
            ->map(fn($item) => (object)[
                'GoodName1' => $item->GoodName1 ?? null,
                'MainGoodUnitID' => $item->MainGoodUnitID ?? null,
                'GoodUnitName' => $item->GoodUnitName ?? null,
                'GoodCode' => strtoupper(trim($item->GoodCode))
            ])
            ->keyBy(fn($g) => $g->GoodCode);

        // โหลด movement ของสินค้าทั้งหมด
        $movementsGrouped = StoreMovement::with('storeOrder')
            ->whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        $response = $storeItems->map(function ($item) use ($goodInfos, $movementsGrouped, $goodUnits) {
            $info = $goodInfos->get(strtoupper(trim($item->good_code)));

            $goodName = $info?->GoodName1 ?? $item->GoodName ?? 'ไม่ระบุ';

            $unitName = $info?->GoodUnitName
                ?? ($info?->MainGoodUnitID && isset($goodUnits[(string)$info->MainGoodUnitID])
                    ? $goodUnits[(string)$info->MainGoodUnitID]->GoodUnitName
                    : 'ชิ้น');

            $movements = $movementsGrouped->get($item->id, collect());

            // เริ่มต้นด้วย stock จริงจาก database
            $stockQty = floatval($item->stock_qty);
            $reservedQty = 0;

            // 🔹 คำนวณ stock / reserved ตาม approved/pending - ใช้ logic เดียวกับ index method
            foreach ($movements as $m) {
                $quantity = floatval($m->quantity);

                if ($m->movement_type === 'issue') {
                    if ($m->type === 'subtract') {
                        if ($m->status === 'pending') {
                            // 📌 pending issue subtract → เพิ่ม reserved (จองสินค้า)
                            $reservedQty += $quantity;
                        } elseif ($m->status === 'approved') {
                            // 📌 approved issue subtract → ลด stock (เบิกสินค้าจริง)
                            $stockQty -= $quantity;
                        }
                        // rejected issue subtract → ไม่ต้องทำอะไร
                    } elseif ($m->type === 'add') {
                        if ($m->status === 'pending') {
                            // 📌 pending issue add → ลด reserved (ยกเลิกการจอง)
                            $reservedQty = max(0, $reservedQty - $quantity);
                        } elseif ($m->status === 'approved') {
                            // 📌 approved issue add → เพิ่ม stock (คืนสินค้า)
                            $stockQty += $quantity;
                        }
                        // rejected issue add → ไม่ต้องทำอะไร
                    }
                } elseif ($m->movement_type === 'return' && $m->status === 'approved') {
                    // 📌 return approved → เพิ่ม stock (คืนสินค้า)
                    $stockQty += $quantity;
                } elseif ($m->movement_type === 'adjustment' && $m->status === 'approved') {
                    // 📌 adjustment → เพิ่ม/ลด stock ตาม type
                    if ($m->type === 'add') {
                        $stockQty += $quantity;
                    } else {
                        $stockQty -= $quantity;
                    }
                } elseif ($m->movement_type === 'receipt' && $m->status === 'approved') {
                    // 📌 receipt → เพิ่ม stock (รับสินค้าเข้า)
                    if ($m->type === 'add') {
                        $stockQty += $quantity;
                    }
                }
            }

            $reservedQty = max($reservedQty, 0);
            $availableQty = max($stockQty - $reservedQty, 0);

            return [
                'GoodCode' => $item->good_code,
                'stock_qty' => $stockQty,
                'reservedQty' => $reservedQty,
                'availableQty' => $availableQty,
                'GoodStockUnitName' => $unitName,
                'GoodName' => $goodName,
            ];
        });

        return response()->json($response);
    }

    public function update(Request $request, $orderId)
    {
        $items = $request->input('items', []);

        // ✅ ดึงรายการเดิมทั้งหมดจาก database
        $existingItems = DB::table('store_order_items')
            ->where('store_order_id', $orderId)
            ->pluck('id')
            ->toArray();

        DB::transaction(function () use ($items, $orderId, $request, $existingItems) {
            // ✅ สร้าง array ของ item IDs ที่ส่งมาจาก frontend
            $submittedItemIds = [];
            foreach ($items as $item) {
                if ($item['id'] != 0) {
                    $submittedItemIds[] = $item['id'];
                }
            }

            // ✅ หา items ที่ถูกลบออกจากฟอร์ม (มีใน database แต่ไม่มีใน request)
            $deletedItemIds = array_diff($existingItems, $submittedItemIds);

            // ✅ ลบรายการที่ถูกลบออกจากฟอร์ม
            if (!empty($deletedItemIds)) {
                foreach ($deletedItemIds as $deletedItemId) {
                    // 🔹 ดึงข้อมูลรายการที่จะลบ
                    $deletedItem = DB::table('store_order_items')
                        ->where('id', $deletedItemId)
                        ->first();

                    if ($deletedItem) {
                        // 🔹 หา store_item_id จาก product_id
                        $storeItem = DB::table('store_items')
                            ->where('good_id', $deletedItem->product_id)
                            ->select('id', 'good_id', 'good_code')
                            ->first();

                        if ($storeItem) {
                            // 🔹 สร้าง movement เพื่อยกเลิกการจอง (ถ้ามี pending movements)
                            $pendingMovements = DB::table('store_movements')
                                ->where('store_order_id', $orderId)
                                ->where('store_item_id', $storeItem->id)
                                ->where('status', 'pending')
                                ->get();

                            foreach ($pendingMovements as $movement) {
                                if ($movement->type === 'subtract') {
                                    // 🔹 สร้าง movement add เพื่อยกเลิกการจอง
                                    DB::table('store_movements')->insert([
                                        'store_item_id'   => $storeItem->id,
                                        'movement_type'   => 'issue',
                                        'type'            => 'add',
                                        'category'        => 'stock',
                                        'quantity'        => $movement->quantity,
                                        'note'            => "ยกเลิกการจองเนื่องจากลบรายการออกจากคำสั่งซื้อ #{$orderId}",
                                        'user_id'         => auth()->id(),
                                        'status'          => 'pending',
                                        'store_order_id'  => $orderId,
                                        'created_at'      => now(),
                                        'updated_at'      => now(),
                                    ]);
                                }
                            }

                            \Log::info('🗑️ Processing deleted item', [
                                'order_id' => $orderId,
                                'deleted_item_id' => $deletedItemId,
                                'product_id' => $deletedItem->product_id,
                                'store_item_id' => $storeItem->id,
                                'pending_movements_count' => $pendingMovements->count()
                            ]);
                        }
                    }

                    // 🔹 ลบรายการออกจาก store_order_items
                    DB::table('store_order_items')
                        ->where('id', $deletedItemId)
                        ->delete();

                    \Log::info('✅ Deleted order item', [
                        'order_id' => $orderId,
                        'deleted_item_id' => $deletedItemId
                    ]);
                }
            }

            // ✅ ประมวลผลรายการที่ส่งมา (เพิ่ม/อัปเดต)
            foreach ($items as $item) {
                // ✅ หาทั้ง id และ good_id จาก good_code
                $storeItem = DB::table('store_items')
                    ->where('good_code', $item['product_code'])
                    ->select('id', 'good_id', 'good_code', 'stock_qty')
                    ->first();

                if (!$storeItem) {
                    \Log::warning('❌ Store item not found', [
                        'order_id' => $orderId,
                        'good_code' => $item['product_code']
                    ]);
                    continue;
                }

                $storeItemId = $storeItem->id;
                $storeItemGoodId = $storeItem->good_id;

                // ✅ ตรวจสอบว่าเป็นสินค้าใหม่ (id = 0) หรือสินค้าเดิม
                if ($item['id'] == 0) {
                    // 🔹 สร้างสินค้าใหม่ใน order - ใช้ good_id
                    $newItemId = DB::table('store_order_items')->insertGetId([
                        'store_order_id' => $orderId,
                        'product_id'     => $storeItemGoodId,
                        'quantity'       => $item['quantity'],
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);

                    // 🔹 สร้าง movement สำหรับสินค้าใหม่ (ถ้ามีจำนวนเบิก)
                    if ($item['quantity'] > 0) {
                        DB::table('store_movements')->insert([
                            'store_item_id'   => $storeItemId,
                            'movement_type'   => 'issue',
                            'type'            => 'subtract',
                            'category'        => 'stock',
                            'quantity'        => $item['quantity'],
                            'note'            => "เพิ่มสินค้าใหม่ในคำสั่งซื้อ #{$orderId}",
                            'user_id'         => auth()->id(),
                            'status'          => 'pending',
                            'store_order_id'  => $orderId,
                            'created_at'      => now(),
                            'updated_at'      => now(),
                        ]);
                    }
                } else {
                    // 🔹 อัปเดตสินค้าเดิม
                    $oldQuantity = DB::table('store_order_items')
                        ->where('id', $item['id'])
                        ->value('quantity');

                    // 🔹 อัปเดต order_item
                    DB::table('store_order_items')
                        ->where('id', $item['id'])
                        ->update([
                            'quantity'   => $item['quantity'],
                            'updated_at' => now(),
                        ]);

                    $quantityChange = $item['quantity'] - $oldQuantity;

                    // 🔹 ถ้ามีการเปลี่ยนแปลงจำนวน
                    if ($quantityChange !== 0) {
                        // 🔹 นับจำนวน movement เฉพาะ pending
                        $totalPendingSubtract = DB::table('store_movements')
                            ->where('store_order_id', $orderId)
                            ->where('store_item_id', $storeItemId)
                            ->where('movement_type', 'issue')
                            ->where('type', 'subtract')
                            ->where('status', 'pending')
                            ->sum('quantity');

                        $totalPendingAdd = DB::table('store_movements')
                            ->where('store_order_id', $orderId)
                            ->where('store_item_id', $storeItemId)
                            ->where('movement_type', 'issue')
                            ->where('type', 'add')
                            ->where('status', 'pending')
                            ->sum('quantity');

                        $currentReservedQty = $totalPendingSubtract - $totalPendingAdd;
                        $desiredReservedQty = $item['quantity'];
                        $delta = $desiredReservedQty - $currentReservedQty;

                        if ($delta !== 0) {
                            if ($delta > 0) {
                                // จองเพิ่ม
                                DB::table('store_movements')->insert([
                                    'store_item_id'   => $storeItemId,
                                    'movement_type'   => 'issue',
                                    'type'            => 'subtract',
                                    'category'        => 'stock',
                                    'quantity'        => $delta,
                                    'note'            => "แก้ไขคำสั่งซื้อ #{$orderId}",
                                    'user_id'         => auth()->id(),
                                    'status'          => 'pending',
                                    'store_order_id'  => $orderId,
                                    'created_at'      => now(),
                                    'updated_at'      => now(),
                                ]);
                            } else {
                                // ยกเลิกการจอง
                                $delta = abs($delta);
                                DB::table('store_movements')->insert([
                                    'store_item_id'   => $storeItemId,
                                    'movement_type'   => 'issue',
                                    'type'            => 'add',
                                    'category'        => 'stock',
                                    'quantity'        => $delta,
                                    'note'            => "แก้ไขคำสั่งซื้อ #{$orderId}",
                                    'user_id'         => auth()->id(),
                                    'status'          => 'pending',
                                    'store_order_id'  => $orderId,
                                    'created_at'      => now(),
                                    'updated_at'      => now(),
                                ]);
                            }
                        }
                    }
                }
            }

            // 🔹 อัปเดต note และ order
            DB::table('store_orders')
                ->where('id', $orderId)
                ->update([
                    'note'       => $request->input('note', ''),
                    'updated_at' => now(),
                ]);

            \Log::info('✅ Order update completed', [
                'order_id' => $orderId,
                'items_count' => count($items),
                'deleted_items_count' => count($deletedItemIds),
                'new_items_count' => count(array_filter($items, fn($item) => $item['id'] == 0)),
                'existing_items_count' => count(array_filter($items, fn($item) => $item['id'] != 0))
            ]);
        });

        return redirect()->back()->with('swal', [
            'title' => 'แก้ไขข้อมูลสำเร็จ!',
            'text' => 'ระบบได้อัปเดตข้อมูลเรียบร้อยแล้ว',
            'icon' => 'success',
            'timer' => 2000,
            'showConfirmButton' => false,
        ]);
    }

    public function searchJson(Request $request)
    {
        $search = trim($request->query('search', ''));
        Log::info('Search query received', ['search' => $search]);

        if (empty($search)) {
            return response()->json(['goods' => []]);
        }

        $searchUpper = strtoupper($search);

        // 1️⃣ Query EMGood จาก SQL Server โดย search GoodCode และ GoodName1
        $goodInfos = DB::connection('sqlsrv2')
            ->table('EMGood as g')
            ->leftJoin('EMGoodUnit as u', 'g.MainGoodUnitID', '=', 'u.GoodUnitID')
            ->select('g.GoodCode', 'g.GoodName1', 'g.MainGoodUnitID', 'u.GoodUnitName')
            ->whereRaw('UPPER(g.GoodCode) LIKE ? OR UPPER(g.GoodName1) LIKE ?', ["%{$searchUpper}%", "%{$searchUpper}%"])
            ->get()
            ->map(fn($item) => (object)[
                'GoodCode' => strtoupper(trim($item->GoodCode)),
                'GoodName1' => $item->GoodName1 ?? null,
                'MainGoodUnitID' => $item->MainGoodUnitID ?? null,
                'GoodUnitName' => $item->GoodUnitName ?? null,
            ])
            ->keyBy(fn($g) => $g->GoodCode);

        if ($goodInfos->isEmpty()) {
            return response()->json(['goods' => []]);
        }

        // 2️⃣ ดึง store_items ที่ good_code ตรงกับ EMGood
        $storeItems = StoreItem::whereIn(DB::raw('UPPER(good_code)'), $goodInfos->keys()->map(fn($v) => strtoupper($v))->toArray())
            ->get();

        if ($storeItems->isEmpty()) {
            return response()->json(['goods' => []]);
        }

        // 3️⃣ โหลด unit ทั้งหมด
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string)$u->GoodUnitID);

        // 4️⃣ โหลด movement
        $movementsGrouped = StoreMovement::with('storeOrder')
            ->whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        // 5️⃣ Map ผลลัพธ์
        $goods = $storeItems->map(function ($item) use ($goodInfos, $movementsGrouped, $goodUnits) {
            $info = $goodInfos->get(strtoupper(trim($item->good_code)));

            $goodName = $info?->GoodName1 ?? 'ไม่ระบุ';
            $unitName = $info?->GoodUnitName
                ?? ($info?->MainGoodUnitID && isset($goodUnits[(string)$info->MainGoodUnitID])
                    ? $goodUnits[(string)$info->MainGoodUnitID]->GoodUnitName
                    : 'ชิ้น');

            $movements = $movementsGrouped->get($item->id, collect());

            $stockQty = floatval($item->stock_qty);
            $reservedQty = 0;

            foreach ($movements as $m) {
                $quantity = floatval($m->quantity);

                if ($m->movement_type === 'issue') {
                    if ($m->type === 'subtract') {
                        if ($m->status === 'pending') $reservedQty += $quantity;
                        elseif ($m->status === 'approved') $stockQty -= $quantity;
                    } elseif ($m->type === 'add') {
                        if ($m->status === 'pending') $reservedQty = max(0, $reservedQty - $quantity);
                        elseif ($m->status === 'approved') $stockQty += $quantity;
                    }
                } elseif ($m->movement_type === 'return' && $m->status === 'approved') {
                    $stockQty += $quantity;
                } elseif ($m->movement_type === 'adjustment' && $m->status === 'approved') {
                    $stockQty += $m->type === 'add' ? $quantity : -$quantity;
                } elseif ($m->movement_type === 'receipt' && $m->status === 'approved') {
                    if ($m->type === 'add') $stockQty += $quantity;
                }
            }

            $reservedQty = max($reservedQty, 0);
            $availableQty = max($stockQty - $reservedQty, 0);

            return [
                'GoodID' => $item->good_id,
                'GoodCode' => $item->good_code,
                'GoodName' => $goodName,
                'GoodStockUnitName' => $unitName,
                'stock_qty' => $stockQty,
                'reservedQty' => $reservedQty,
                'availableQty' => $availableQty,
                'price' => $item->price,
            ];
        });

        return response()->json(['goods' => $goods]);
    }

}
