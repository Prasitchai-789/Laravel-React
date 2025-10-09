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

class StoreOrderController extends Controller
{

    public function index(Request $request)
    {
        $goodCode = $request->query('search');

        // dd($request);
        $storeItems = StoreItem::when($goodCode, fn($q) => $q->where('good_code', $goodCode))->get();

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
            ->select(
                'g.GoodCode',
                'g.GoodName1',
                'g.MainGoodUnitID',
                'u.GoodUnitName'
            )
            ->get()
            ->map(function ($item) {
                // ให้ property มีค่า default เพื่อป้องกัน undefined property
                $item->GoodName1 = $item->GoodName1 ?? null;
                $item->MainGoodUnitID = $item->MainGoodUnitID ?? null;
                $item->GoodUnitName = $item->GoodUnitName ?? null;
                return $item;
            })
            ->keyBy(fn($g) => strtoupper(trim($g->GoodCode)));

        // โหลด movement ของสินค้าทั้งหมด
        $movementsGrouped = StoreMovement::with('storeOrder')
            ->whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        $goods = $storeItems->map(function ($item) use ($goodInfos, $movementsGrouped, $goodUnits) {
            $info = $goodInfos->get(strtoupper(trim($item->good_code)));

            $goodName = $info?->GoodName1 ?? $item->GoodName ?? 'ไม่ระบุ';

            // หาหน่วยสินค้า
            $unitName = $info?->GoodUnitName
                ?? ($info?->MainGoodUnitID && isset($goodUnits[(string)$info->MainGoodUnitID])
                    ? $goodUnits[(string)$info->MainGoodUnitID]->GoodUnitName
                    : 'ชิ้น');

            $movements = $movementsGrouped->get($item->id, collect());

            $stockQty = $item->stock_qty;
            $safetyStock = $item->safety_stock;

            $reservedQty = $movements
                ->where('movement_type', 'issue')
                ->where('type', 'subtract')
                ->where('status', 'pending')
                ->sum('quantity');

            foreach ($movements as $m) {
                if ($m->status !== 'approved') continue;

                $delta = match ($m->movement_type) {
                    'issue' => ($m->type === 'subtract' ? -1 : 1),
                    'return' => 1,
                    'adjustment' => ($m->type === 'add' ? 1 : -1),
                    default => 0
                } * $m->quantity;

                if ($m->category === 'stock') $stockQty += $delta;
                elseif ($m->category === 'safety') $safetyStock += $delta;
            }

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
        $perPage = 20;

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
        // 1️⃣ โหลด orders + items + good - แก้ไขการเรียงลำดับตามวันที่
        $webOrdersQuery = StoreOrder::with(['items.good'])
            ->orderBy('order_date', 'desc')  // ← เรียงตามวันที่สั่ง (ใหม่ก่อน)
            ->orderBy('id', 'desc');         // ← ถ้าวันที่ซ้ำกันให้เรียงตาม ID

        // การค้นหา
        if (!empty($search)) {
            $webOrdersQuery->where(function ($query) use ($search) {
                $query->where('document_number', 'like', '%' . $search . '%')
                    ->orWhereHas('items.good', function ($q) use ($search) {
                        $q->where('GoodName1', 'like', '%' . $search . '%')
                            ->orWhere('GoodCode', 'like', '%' . $search . '%');
                    });
            });
        }

        // กรองสถานะ
        if (!empty($status)) {
            $webOrdersQuery->where('status', $status);
        }

        // กรองตามวันที่
        if (!empty($dailyDate)) {
            $webOrdersQuery->whereDate('order_date', $dailyDate);
        }

        $total = $webOrdersQuery->count();

        $webOrders = $webOrdersQuery
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // 2️⃣ โหลด EMGoodUnit ทั้งหมด
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string) $u->GoodUnitID);

        // 3️⃣ โหลด EMGood ของสินค้าทั้งหมดใน orders
        $goodIds = $webOrders->flatMap(fn($o) => $o->items->pluck('product_id'))->unique()->toArray();

        $goods = DB::connection('sqlsrv2')
            ->table('EMGood')
            ->select('GoodID', 'GoodName1', 'MainGoodUnitID')
            ->whereIn('GoodID', $goodIds)
            ->get()
            ->keyBy('GoodID'); // ใช้ GoodID เป็น key

        // 4️⃣ map orders
        $allOrders = $webOrders->map(function ($order) use ($goodUnits, $goods) {

            // โหลด movements ของ order พร้อม join store_order_items เพื่อดึง product_id
            $orderMovements = StoreMovement::query()
                ->select('store_movements.*', 'store_order_items.product_id as movement_product_id')
                ->leftJoin('store_items', 'store_items.id', '=', 'store_movements.store_item_id')
                ->leftJoin('store_order_items', function ($join) use ($order) {
                    $join->on('store_order_items.store_order_id', '=', 'store_movements.store_order_id')
                        ->on('store_order_items.product_id', '=', 'store_items.good_id');
                })
                ->with('user')
                ->where('store_movements.store_order_id', $order->id)
                ->get();

            $items = $order->items->map(function ($item) use ($orderMovements, $goodUnits, $goods) {

                // history ของ item
                $history = $orderMovements
                    ->filter(fn($m) => $m->movement_product_id == $item->product_id)
                    ->map(function ($m) {
                        $empName = null;
                        if (!empty($m->user?->employee_id)) {
                            $empName = DB::connection('sqlsrv2')
                                ->table('dbo.Webapp_Emp')
                                ->where('EmpID', $m->user->employee_id)
                                ->value('EmpName');
                        }

                        return [
                            'movement_type' => $m->movement_type == 'return' ? 'คืน' : 'เบิก',
                            'quantity'      => $m->quantity,
                            'docu_no'       => $m->store_order_id ? 'SO-' . $m->store_order_id : $m->id,
                            'docu_date'     => $m->created_at?->format('Y-m-d H:i:s') ?? '-',
                            'user_id'       => $empName ?? $m->user?->name ?? 'ไม่ระบุ',
                            'product_id'    => $m->movement_product_id,
                        ];
                    })
                    ->sortBy('docu_date')
                    ->values();

                // คำนวณ issued / returned / pending
                $issuedFromHistory   = $history->where('movement_type', 'เบิก')->sum('quantity');
                $returnedFromHistory = $history->where('movement_type', 'คืน')->sum('quantity');

                $totalIssued = round($item->quantity + $issuedFromHistory, 2);
                $pendingQty  = round($totalIssued - $returnedFromHistory, 2);

                // ✅ lookup unit จาก EMGoodUnit
                $itemGood = $goods[$item->product_id] ?? null;
                $unitName = '-';
                if ($itemGood) {
                    $unitId = (string) $itemGood->MainGoodUnitID;
                    $unitName = $goodUnits->get($unitId)?->GoodUnitName ?? '-';
                }

                return [
                    'id'           => $item->id,
                    'product_id'   => $item->product_id,
                    'product_name' => $item->good?->GoodName1 ?? $itemGood?->GoodName1 ?? '-',
                    'product_code' => $item->good?->GoodCode ?? $item->product_id,
                    'quantity'     => $item->quantity,
                    'unit'         => $unitName,
                    'history'      => $history,
                    'totalIssued'  => $totalIssued,
                    'pendingQty'   => $pendingQty,
                ];
            });

            return [
                'id'              => $order->id,
                'document_number' => $order->document_number,
                'order_date'      => $order->order_date
                    ? \Carbon\Carbon::parse($order->order_date)->format('Y-m-d H:i:s')
                    : now()->format('Y-m-d H:i:s'),
                'status'          => $order->status ?? 'รออนุมัติ',
                'department'      => $order->department ?? '-',
                'requester'       => $order->requester ?? '-',
                'source'          => 'WEB',
                'items'           => $items,
            ];
        });

        $paginatedOrders = new \Illuminate\Pagination\LengthAwarePaginator(
            $allOrders,
            $total,
            $perPage,
            $page,
            [
                'path'  => request()->url(),
                'query' => array_merge(request()->query(), ['source' => 'WEB']),
            ]
        );

        return \Inertia\Inertia::render('Store/StoreIssueIndex', [
            'orders'     => $paginatedOrders->items(),
            'pagination' => $paginatedOrders,
        ]);
    }
    private function parseDate($dateString)
    {
        if (!$dateString) {
            return null;
        }

        // ถ้าเป็น Carbon instance อยู่แล้ว ก็ return เลย
        if ($dateString instanceof \Carbon\Carbon) {
            return $dateString;
        }

        try {
            $formats = [
                'j/n/Y H:i:s', // 31/8/2025 00:00:00
                'd/m/Y H:i:s', // 31/08/2025 00:00:00
                'Y-m-d H:i:s', // 2025-08-31 00:00:00
            ];

            foreach ($formats as $format) {
                $date = \Carbon\Carbon::createFromFormat($format, $dateString);
                if ($date !== false) {
                    return $date;
                }
            }

            return \Carbon\Carbon::parse(str_replace('/', '-', $dateString));
        } catch (\Exception $e) {
            return null;
        }
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

        // 2️⃣ ดึง EMGoodUnit จาก SQL Server
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string) $u->GoodUnitID);

        // 3️⃣ ดึงชื่อสินค้า จาก EMGood (SQL Server)
        $goodNames = DB::connection('sqlsrv2')
            ->table('EMGood')
            ->select('GoodCode', 'GoodName1')
            ->get()
            ->keyBy('GoodCode');

        // 4️⃣ ดึง movement ของทุก store_item_id
        $movementsGrouped = StoreMovement::whereIn('store_item_id', $storeItems->pluck('id'))
            // ->where('store_order_id', $orderId) // <-- กรองเฉพาะ order ปัจจุบัน
            ->get()
            ->groupBy('store_item_id');


        // 5️⃣ รวมข้อมูลและคำนวณ stock / reserved / available
        $goods = $storeItems->map(function ($item) use ($goodUnits, $goodNames, $movementsGrouped) {
            $unitId = (string) $item->GoodUnitID;
            $unitName = $goodUnits->get($unitId)->GoodUnitName ?? 'ชิ้น';
            $goodName = $goodNames->get($item->good_code)->GoodName1 ?? 'ไม่ระบุ';

            $movements = $movementsGrouped->get($item->id, collect());

            $stockQty = $item->stock_qty;
            $safetyStock = $item->safety_stock;

            // คำนวณ reservedQty (issue + subtract + pending)
            $reservedQty = $movements
                ->filter(
                    fn($m) =>
                    $m->movement_type === 'issue' &&
                        $m->type === 'subtract' &&
                        $m->status === 'pending'
                )
                ->sum('quantity');

            // ปรับ stock/safety ตาม movement (approved)
            foreach ($movements as $m) {
                switch ($m->movement_type) {
                    case 'issue':
                        if ($m->status === 'approved' && $m->type === 'subtract') {
                            if ($m->category === 'stock')
                                $stockQty -= $m->quantity;
                            elseif ($m->category === 'safety')
                                $safetyStock -= $m->quantity;
                        } elseif ($m->status === 'rejected' && $m->type === 'subtract') {
                            // คืน stock เมื่อเอกสารถูก reject
                            if ($m->category === 'stock')
                                $stockQty += $m->quantity;
                            elseif ($m->category === 'safety')
                                $safetyStock += $m->quantity;
                        }
                        break;

                    case 'return':
                        if ($m->status === 'approved') {
                            if ($m->category === 'stock')
                                $stockQty += $m->quantity;
                            elseif ($m->category === 'safety')
                                $safetyStock += $m->quantity;
                        }
                        break;
                    case 'adjustment':
                        if ($m->status === 'approved') {
                            $delta = $m->quantity * ($m->type === 'add' ? 1 : -1);
                            if ($m->category === 'stock')
                                $stockQty += $delta;
                            elseif ($m->category === 'safety')
                                $safetyStock += $delta;
                        }
                        break;
                }
            }

            // คำนวณ availableQty
            $availableQty = max($stockQty - $reservedQty, 0);


            // dd("e");
            return (object) [
                'GoodID' => $item->good_id,
                'GoodCode' => $item->good_code,
                'GoodName' => $goodName,
                'GoodStockUnitName' => $unitName,
                'stock_qty' => $stockQty,
                'safety_stock' => $safetyStock,
                'reservedQty' => $reservedQty,
                'availableQty' => $availableQty,
                'price' => $item->price,
            ];
        });
        // dd($goods);
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

        $order = StoreOrder::findOrFail($order->id);

        // ดึงชื่อจากฝ่าย ถ้า auth มี employee_id
        $user = auth()->user();
        $employeeName = $user->name ?? $user->id; // fallback

        if (!empty($user->employee_id)) {
            try {
                $employee = DB::connection('sqlsrv2')
                    ->table('dbo.Webapp_Emp')
                    ->select('EmpName')
                    ->where('EmpID', $user->employee_id)
                    ->first();

                if ($employee) {
                    $employeeName = $employee->EmpName ?? $employeeName;
                }
            } catch (\Exception $e) {
                \Log::error('Error fetching employee data', ['error' => $e->getMessage()]);
            }
        }

        // บันทึก status และ user_approved ถ้า approved หรือ rejected
        $order->status = $status;
        $order->user_approved = in_array($status, ['approved', 'rejected']) ? $employeeName : null;
        $order->save();

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
    // SO-20250924062134
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

    // GoodController.php
    public function searchNew(Request $request)
    {
        $query = $request->input('query', '');

        // Subquery ดึงราคาล่าสุดจาก ICStockDetail (1 แถวต่อ GoodID)
        $latestPriceSub = DB::connection('sqlsrv2')
            ->table('ICStockDetail as s1')
            ->select('s1.GoodID', 's1.GoodUnitID2', 's1.GoodPrice2', 's1.DocuDate')
            ->whereRaw('s1.DocuDate = (
            SELECT MAX(s2.DocuDate)
            FROM ICStockDetail s2
            WHERE s2.GoodID = s1.GoodID
        )');

        // Query หลักจาก EMGood + join sub + join store_items
        $goods = DB::connection('sqlsrv2')
            ->table('EMGood as g')
            ->leftJoinSub($latestPriceSub, 's', 'g.GoodID', '=', 's.GoodID')
            ->leftJoin(DB::connection('sqlsrv')->getDatabaseName() . '.dbo.store_items as si', function ($join) {
                $join->on('g.GoodID', '=', 'si.good_id')
                    ->on('g.GoodCode', '=', 'si.good_code');
            })
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
                DB::raw('ISNULL(SUM(si.stock_qty), 0) as stock_qty'),
                DB::raw('ISNULL(SUM(si.safety_stock), 0) as safety_stock')
            ])
            ->groupBy('g.GoodCode', 'g.GoodID', 'g.GoodName1', 's.GoodUnitID2', 's.GoodPrice2', 's.DocuDate')
            ->orderBy('g.GoodCode')
            ->limit(50)
            ->get();

        // อัปเดต status ให้ชัดเจน
        foreach ($goods as $good) {
            $status = [];
            if ($good->stock_qty > 0 || $good->safety_stock > 0) {
                $status[] = '✅ มีอยู่แล้วใน store_items';
            } else {
                $status[] = '➕ ยังไม่มีใน store_items';
            }

            $good->status = implode(' | ', $status);
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
}
