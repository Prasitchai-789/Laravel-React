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

    public function index(Request $request){

        $goodCode = $request->query('goodCode');

        // 1️⃣ ดึง store_items ทั้งหมด หรือ filter ตาม GoodCode
        $storeItems = StoreItem::when($goodCode, fn($q) => $q->where('good_code', $goodCode))->get();

        // 2️⃣ ดึง unit และชื่อสินค้า จาก SQL Server
        $goodUnits = DB::connection('sqlsrv2')
            ->table('EMGoodUnit')
            ->select('GoodUnitID', 'GoodUnitName')
            ->get()
            ->keyBy(fn($u) => (string) $u->GoodUnitID);

        $goodNames = DB::connection('sqlsrv2')
            ->table('EMGood')
            ->select('GoodCode', 'GoodName1')
            ->get()
            ->keyBy('GoodCode');

        // 3️⃣ ดึง movements ของ store_items
        $movementsGrouped = StoreMovement::whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        // 4️⃣ รวมข้อมูลและคำนวณ stock / reserved / available
        $goods = $storeItems->map(function ($item) use ($goodUnits, $goodNames, $movementsGrouped) {
            $unitId = (string) $item->GoodUnitID;
            $unitName = $goodUnits->get($unitId)->GoodUnitName ?? 'ชิ้น';
            $goodName = $goodNames->get($item->good_code)->GoodName1 ?? $item->GoodName ?? 'ไม่ระบุ';

            $movements = $movementsGrouped->get($item->id, collect());

            $stockQty = $item->stock_qty;
            $safetyStock = $item->safety_stock;

            $reservedQty = $movements
                ->filter(
                    fn($m) =>
                    $m->movement_type === 'issue' &&
                    $m->type === 'subtract' &&
                    $m->status === 'pending'
                )
                ->sum('quantity');

            foreach ($movements as $m) {
                if ($m->status !== 'approved')
                    continue;

                switch ($m->movement_type) {
                    case 'issue':
                        if ($m->type === 'subtract') {
                            if ($m->category === 'stock')
                                $stockQty -= $m->quantity;
                            elseif ($m->category === 'safety')
                                $safetyStock -= $m->quantity;
                        }
                        break;
                    case 'return':
                        if ($m->category === 'stock')
                            $stockQty += $m->quantity;
                        elseif ($m->category === 'safety')
                            $safetyStock += $m->quantity;
                        break;
                    case 'adjustment':
                        $delta = $m->quantity * ($m->type === 'add' ? 1 : -1);
                        if ($m->category === 'stock')
                            $stockQty += $delta;
                        elseif ($m->category === 'safety')
                            $safetyStock += $delta;
                        break;
                }
            }

            $availableQty = $stockQty - $reservedQty;

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



    public function show(StoreOrder $order){
        // โหลดความสัมพันธ์ด้วยถ้าจำเป็น
        $order->load('items');

        return Inertia::render('Store/StoreOrderShow', [
            'order' => $order,
        ]);
    }

    public function StoreIssueIndex(){
        $page = request()->get('page', 1);
        $perPage = 20;

        $source = request()->get('source', 'WIN'); // รับพารามิเตอร์ source จาก URL
        $search = request()->get('search', '');    // รับ searchTerm
        $status = request()->get('status', '');    // รับ statusFilter
        $dailyDate = request()->get('dailyDate', ''); // รับ dailyDate dd/mm/yyyy

        if ($source === 'WIN') {
            return $this->getWinOrders($page, $perPage, $search, $status, $dailyDate);
        } else {
            return $this->getWebOrders($page, $perPage, $search, $status, $dailyDate);
        }
    }

    private function getWinOrders($page, $perPage){
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

    private function getWebOrders($page, $perPage)
    {
        // โหลด orders + items + good
        $webOrdersQuery = StoreOrder::with(['items.good'])
            ->orderBy('created_at', 'desc');

        $total = $webOrdersQuery->count();

        $webOrders = $webOrdersQuery
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $allOrders = $webOrders->map(function ($order) {

            // โหลด movements ของ order นี้ พร้อม user
            $orderMovements = StoreMovement::with('user')
                ->where('store_order_id', $order->id)
                ->get();

            return [
                'id' => $order->id,
                'document_number' => $order->document_number,
                'order_date' => $order->order_date
                    ? \Carbon\Carbon::parse($order->order_date)->format('Y-m-d H:i:s')
                    : now()->format('Y-m-d H:i:s'),
                'status' => $order->status ?? 'รออนุมัติ',
                'department' => $order->department ?? '-',
                'requester' => $order->requester ?? '-',
                'source' => 'WEB',
                'items' => $order->items->map(function ($item) use ($orderMovements) {

                    // หา store_item ที่ตรงกับ good_id ของ item
                    $storeItem = StoreItem::where('good_id', $item->good_id)->first();

                    $history = collect(); // default empty collection

                    if ($storeItem) {
                        $history = $orderMovements
                            ->filter(
                                fn($m) =>
                                $m->store_item_id == $storeItem->id &&
                                $m->movement_type == 'return'
                            )
                            ->map(fn($m) => [
                                'movement_type' => 'คืน',
                                'quantity' => $m->quantity,
                                'docu_no' => $m->store_order_id ? 'SO-' . $m->store_order_id : $m->id,
                                'docu_date' => $m->created_at?->format('Y-m-d H:i:s') ?? '-',
                                'user_id' => $m->user?->name ?? 'ไม่ระบุ',
                            ])
                            ->sortBy('docu_date')
                            ->values();
                    }

                    return [
                        'id' => $item->id,
                        'product_name' => $item->good?->GoodName1 ?? '-',
                        'product_code' => $item->good?->GoodCode ?? '-',
                        'quantity' => $item->quantity,
                        'unit' => $item->unit ?? ($item->good?->Unit ?? '-'),
                        'history' => $history,
                    ];
                })->values(),
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
        $data = $request->validate([
            'user_id' => 'required',
            'department_id' => 'required',
            'items' => 'required|array|min:1',
            'items.*.good_id' => 'required',
            'items.*.qty' => 'required|integer|min:1',
            'note' => 'nullable|string',
        ]);
        // dd($request);
        $order = null;

        DB::transaction(function () use ($data, &$order) {
            $user = Auth::user();

            $departmentName = !empty($user->employee_id)
                ? $user->employee_id
                : 'ไม่ระบุ';

            // สร้างคำสั่งเบิก
            $order = StoreOrder::create([
                'document_number' => 'SO-' . now()->format('YmdHis'),
                'order_date' => now(),
                'status' => 'pending', // 👈 เก็บเป็นภาษาเดียวกับที่ updateStatus ตรวจสอบ
                'department' => $departmentName,
                'requester' => $user->name,
                'note' => $data['note'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $goodUnit = DB::connection('sqlsrv2')
                    ->table('EMGoodUnit')
                    ->where('GoodUnitID', $item['good_id'])
                    ->first();

                $storeItem = \App\Models\StoreItem::where('good_id', $item['good_id'])->first();

                // ✅ เก็บรายละเอียดรายการใน order
                $order->items()->create([
                    'product_id' => $item['good_id'],  //แก้ไขจาก good_id เป็น product_id
                    'quantity' => $item['qty'],
                    'unit' => $goodUnit->GoodUnitCode ?? 'pcs',
                ]);

                // บันทึก movement ด้วย Eloquent
                StoreMovement::create([
                    'store_item_id' => $storeItem->id,
                    'user_id' => $user->id,
                    'movement_type' => 'issue',
                    'category' => 'stock',
                    'type' => 'subtract',
                    'quantity' => $item['qty'],
                    // ✅ เก็บทั้งเลขที่เอกสาร และ note ของผู้ใช้
                    'note' => "Order {$order->document_number}"
                        . (!empty($data['note']) ? " - {$data['note']}" : ""),
                    'store_order_id' => $order->id,
                ]);


                // ❌ ไม่ลด stock ทันที
                // ✅ รอจนกว่าจะ approved ค่อยลดใน updateStatus()
            }
        });

        return back()->with([
            'success' => true,
            'message' => '✅ ทำการบันทึกคำสั่งเบิกเรียบร้อย รออนุมัติ',
            'order_id' => $order->id
        ]);
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
        // รับค่า status
        $status = strtolower($request->json('status', $request->status));
        $request->merge(['status' => $status]);

        $request->validate([
            'status' => 'required|string|in:pending,approved,rejected',
        ]);

        // อัปเดต order
        $order->status = $status;
        $order->save();

        $items = $order->items;

        if ($items->isNotEmpty()) {
            foreach ($items as $item) {
                $storeItem = \App\Models\StoreItem::where('good_id', $item->good_id)->first();
                if (!$storeItem)
                    continue;

                // หา movement เดิม โดยใช้ store_item_id + document_number
                $movement = \App\Models\StoreMovement::where('store_item_id', $storeItem->id)
                    ->where(function ($query) use ($order) {
                        $query->where('note', 'like', "%{$order->document_number}%")
                            ->orWhere('note', 'like', "%Order {$order->document_number}%");
                    })
                    ->latest('id')
                    ->first();

                if ($movement) {
                    $movement->update(['status' => $status]);
                } else {
                    \Log::warning("No movement found for Order {$order->document_number} / Item {$storeItem->id}");
                }
            }
        }

        // ✅ Redirect กลับไปหน้าเดิม พร้อม flash message
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
        $request->validate([
            'document_number' => 'required|string',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:store_order_items,id',
            'items.*.store_item_id' => 'required|string', // GoodID
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        // ดึง order
        $order = StoreOrder::where('document_number', $request->document_number)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => "ไม่พบคำสั่งเบิกเลขที่ {$request->document_number}"
            ], 404);
        }

        if ($order->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => "ไม่สามารถคืนสินค้าได้ เนื่องจากคำสั่งเบิกอยู่ในสถานะ '{$order->status}'"
            ], 422);
        }

        foreach ($request->items as $itemData) {
            $storeItem = StoreItem::where('good_id', $itemData['store_item_id'])->first();
            if (!$storeItem)
                continue;

            // ดึงรายการเบิกที่เกี่ยวข้อง
            $orderItem = $order->items()->where('id', $itemData['product_id'])->first();
            if (!$orderItem)
                continue;

            $borrowedQty = $orderItem->quantity;

            // ✅ ดึงจำนวนที่คืนไปแล้ว (เช็คจาก store_order_id ที่เพิ่งเพิ่มใน movements)
            $returnedQty = StoreMovement::where('store_order_id', $order->id)
                ->where('store_item_id', $storeItem->id)
                ->where('movement_type', 'return')
                ->where('status', 'approved')
                ->sum('quantity');

            $remainingQty = $borrowedQty - $returnedQty;

            if ($itemData['quantity'] > $remainingQty) {
                return response()->json([
                    'success' => false,
                    'message' => "จำนวนคืน {$itemData['quantity']} ของ {$storeItem->good_id} เกินจำนวนที่เบิก (เหลือคืนได้ {$remainingQty})"
                ], 422);
            }

            // ✅ บันทึก movement และผูกกับ order
            StoreMovement::create([
                'store_item_id' => $storeItem->id,
                'store_order_id' => $order->id, // 👈 เพิ่มความสัมพันธ์
                'movement_type' => 'return',
                'type' => 'add',
                'category' => $itemData['category'],
                'quantity' => $itemData['quantity'],
                'note' => $itemData['note'] ?? "คืนจาก Order {$order->document_number}",
                'user_id' => auth()->id(),
                'status' => 'approved',
            ]);

            // เพิ่มสต็อก
            $storeItem->increment('stock_qty', $itemData['quantity']);
        }

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

                $storeItem = StoreItem::where('good_id', $item->good_id)->first();
                $returnedQty = 0;

                if ($storeItem) {
                    // ✅ ดึงจาก store_movements โดยใช้ store_order_id แทน join
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
                    'good_id' => $item->good_id,
                    'good_name' => $item->good?->GoodName1 ?? 'Unknown',
                    'borrowed_quantity' => $borrowedQty,
                    'returned_quantity' => $returnedQty,
                    'remaining_quantity' => $remainingQty,
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







    public function storeReturn(Request $request)
    {
        $request->validate([
            'document_number' => 'required|string',
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:store_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.movement_type' => 'required|string',
            'items.*.type' => 'required|string',
            'items.*.category' => 'required|string',
            'items.*.note' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->items as $item) {
                $storeItem = StoreItem::find($item['product_id']);
                if (!$storeItem)
                    continue;

                // ตรวจสอบจำนวนคืนได้
                $borrowedQty = $storeItem->orders()
                    ->where('document_number', $request->document_number)
                    ->sum('quantity');

                $returnedQty = StoreMovement::where('store_item_id', $storeItem->id)
                    ->where('movement_type', 'return')
                    ->where('status', 'approved')
                    ->sum('quantity');

                $remainingQty = $borrowedQty - $returnedQty;
                $qtyToReturn = min($item['quantity'], $remainingQty);

                if ($qtyToReturn <= 0)
                    continue;

                // สร้าง movement
                StoreMovement::create([
                    'store_item_id' => $storeItem->id,
                    'movement_type' => $item['movement_type'], // return
                    'type' => $item['type'],                 // add
                    'category' => $item['category'],         // stock/safety
                    'quantity' => $qtyToReturn,
                    'note' => $item['note'] ?? null,
                    'user_id' => auth()->id(),
                    'status' => 'approved',
                ]);

                // อัปเดต stock
                $storeItem->increment('current_stock', $qtyToReturn);
            }

            DB::commit();

            return response()->json(['message' => 'คืนสินค้าสำเร็จ'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
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


}
