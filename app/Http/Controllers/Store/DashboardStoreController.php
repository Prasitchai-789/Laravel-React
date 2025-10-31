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
use Illuminate\Support\Facades\Schema;

class DashboardStoreController extends Controller
{

    public function Dashboard()
    {


        return Inertia::render('Store/Dashboard');
    }

 public function Withdrawal(Request $request)
{
    try {
        $range = $request->get('range', 'month'); // month, quarter, year, all, custom
        $date = $request->get('date');           // วันเดียว (string)
        $startDate = $request->get('startDate'); // ช่วงเริ่มต้น (string)
        $endDate = $request->get('endDate');     // ช่วงสิ้นสุด (string)

        // สร้าง query พื้นฐานสำหรับเดือนปัจจุบัน
        $currentQuery = StoreOrder::query();

        // สร้าง query สำหรับเดือนที่แล้ว
        $previousQuery = StoreOrder::query();

        // กรองข้อมูลตามช่วงเวลา
        if ($range === 'custom') {
            if ($date) {
                // วันเดียว
                $currentQuery->whereDate('created_at', $date);
                // สำหรับเดือนที่แล้ว - ใช้เดือนก่อนหน้าของวันที่เลือก
                $previousDate = date('Y-m-d', strtotime($date . ' -1 month'));
                $previousQuery->whereDate('created_at', $previousDate);
            } elseif ($startDate && $endDate) {
                // ช่วงวันที่
                $currentQuery->whereBetween('created_at', [
                    date('Y-m-d', strtotime($startDate)),
                    date('Y-m-d', strtotime($endDate))
                ]);
                // สำหรับเดือนที่แล้ว - ขยาดช่วงเวลาไปเดือนก่อนหน้า
                $previousStartDate = date('Y-m-d', strtotime($startDate . ' -1 month'));
                $previousEndDate = date('Y-m-d', strtotime($endDate . ' -1 month'));
                $previousQuery->whereBetween('created_at', [
                    $previousStartDate,
                    $previousEndDate
                ]);
            }
        } elseif ($range === 'month') {
            // เดือนปัจจุบัน
            $currentQuery->whereMonth('created_at', date('m'))
                        ->whereYear('created_at', date('Y'));
            // เดือนที่แล้ว
            $previousMonth = date('m', strtotime('-1 month'));
            $previousYear = date('Y', strtotime('-1 month'));
            $previousQuery->whereMonth('created_at', $previousMonth)
                         ->whereYear('created_at', $previousYear);
        } elseif ($range === 'quarter') {
            $currentMonth = date('n');
            $currentQuarter = ceil($currentMonth / 3);
            $startMonth = ($currentQuarter - 1) * 3 + 1;
            $endMonth = $startMonth + 2;
            $currentQuery->whereMonth('created_at', '>=', $startMonth)
                        ->whereMonth('created_at', '<=', $endMonth)
                        ->whereYear('created_at', date('Y'));

            // ไตรมาสที่แล้ว
            $previousQuarter = $currentQuarter - 1;
            if ($previousQuarter === 0) {
                $previousQuarter = 4;
                $previousYear = date('Y') - 1;
            } else {
                $previousYear = date('Y');
            }
            $previousStartMonth = ($previousQuarter - 1) * 3 + 1;
            $previousEndMonth = $previousStartMonth + 2;
            $previousQuery->whereMonth('created_at', '>=', $previousStartMonth)
                         ->whereMonth('created_at', '<=', $previousEndMonth)
                         ->whereYear('created_at', $previousYear);
        } elseif ($range === 'year') {
            // ปีปัจจุบัน
            $currentQuery->whereYear('created_at', date('Y'));
            // ปีที่แล้ว
            $previousQuery->whereYear('created_at', date('Y') - 1);
        }
        // 'all' ไม่ต้องกรอง - สำหรับ all ไม่คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง

        // นับจำนวนตามสถานะสำหรับเดือนปัจจุบัน
        $currentCounts = $currentQuery->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        ")->first();

        // นับจำนวนตามสถานะสำหรับเดือนที่แล้ว
        $previousCounts = $previousQuery->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        ")->first();

        // ฟังก์ชันคำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
        $calculateChange = function($current, $previous) {
            if ($previous == 0) {
                return $current > 0 ? 100.0 : 0.0;
            }
            return (($current - $previous) / $previous) * 100;
        };

        // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
        $totalChange = $calculateChange(
            (int) ($currentCounts->total ?? 0),
            (int) ($previousCounts->total ?? 0)
        );

        $pendingChange = $calculateChange(
            (int) ($currentCounts->pending ?? 0),
            (int) ($previousCounts->pending ?? 0)
        );

        $approvedChange = $calculateChange(
            (int) ($currentCounts->approved ?? 0),
            (int) ($previousCounts->approved ?? 0)
        );

        $rejectedChange = $calculateChange(
            (int) ($currentCounts->rejected ?? 0),
            (int) ($previousCounts->rejected ?? 0)
        );

        // log debug
        \Log::info('Withdrawal API Called', [
            'range' => $range,
            'date' => $date,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'current_counts' => $currentCounts,
            'previous_counts' => $previousCounts,
            'changes' => [
                'total' => $totalChange,
                'pending' => $pendingChange,
                'approved' => $approvedChange,
                'rejected' => $rejectedChange
            ]
        ]);

        return response()->json([
            'success' => true,
            'total' => (int) ($currentCounts->total ?? 0),
            'pending' => (int) ($currentCounts->pending ?? 0),
            'approved' => (int) ($currentCounts->approved ?? 0),
            'rejected' => (int) ($currentCounts->rejected ?? 0),
            'totalChange' => round($totalChange, 1),
            'pendingChange' => round($pendingChange, 1),
            'approvedChange' => round($approvedChange, 1),
            'rejectedChange' => round($rejectedChange, 1),
        ]);
    } catch (\Exception $e) {
        \Log::error('Withdrawal API Error: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            'total' => 0,
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
            'totalChange' => 0,
            'pendingChange' => 0,
            'approvedChange' => 0,
            'rejectedChange' => 0,
        ], 500);
    }
}


    public function StockOrder(Request $request)
    {
        // ดึงสินค้าทั้งหมดจาก store_items
        $storeItems = \DB::table('store_items')
            ->select('id', 'good_id', 'good_code', 'GoodUnitID', 'stock_qty', 'safety_stock', 'price')
            ->get();

        // โหลด movement ของสินค้าทั้งหมด
        $movementsGrouped = \App\Models\StoreMovement::whereIn('store_item_id', $storeItems->pluck('id'))
            ->get()
            ->groupBy('store_item_id');

        $result = $storeItems->map(function ($item) use ($movementsGrouped) {
            $stockQty = floatval($item->stock_qty);
            $safetyStock = floatval($item->safety_stock);
            $reservedQty = 0;

            $movements = $movementsGrouped->get($item->id, collect());

            foreach ($movements as $m) {
                $qty = floatval($m->quantity);

                if ($m->movement_type === 'issue') {
                    if ($m->type === 'subtract') {
                        $m->status === 'pending' ? $reservedQty += $qty : ($m->status === 'approved' ? $stockQty -= $qty : null);
                    } elseif ($m->type === 'add') {
                        $m->status === 'pending' ? $reservedQty = max(0, $reservedQty - $qty) : ($m->status === 'approved' ? $stockQty += $qty : null);
                    }
                } elseif ($m->movement_type === 'return' && $m->status === 'approved') {
                    $stockQty += $qty;
                } elseif ($m->movement_type === 'adjustment' && $m->status === 'approved') {
                    $m->type === 'add' ? $stockQty += $qty : $stockQty -= $qty;
                } elseif ($m->movement_type === 'receipt' && $m->status === 'approved') {
                    $m->type === 'add' ? $stockQty += $qty : null;
                }
            }

            $reservedQty = max($reservedQty, 0);
            $availableQty = max($stockQty - $reservedQty, 0);

            return [
                'good_id' => $item->good_id,
                'good_code' => $item->good_code,
                'GoodUnitID' => $item->GoodUnitID,
                'stock_qty' => $stockQty,
                'safety_stock' => $safetyStock,
                'reservedQty' => $reservedQty,
                'availableQty' => $availableQty,
                'price' => $item->price,
            ];
        });

        return response()->json($result);
    }

    public function recentApprovals()
    {
        try {
            \Log::info('🚀 Starting recentApprovals function');

            // ใช้แบบง่ายๆ ก่อน
            $approvals = StoreOrder::with(['items'])
                ->where('status', 'approved')
                ->orderBy('updated_at', 'desc')
                ->take(6)
                ->get();

            \Log::info('📊 Found ' . $approvals->count() . ' approved orders');

            $result = [];

            foreach ($approvals as $order) {
                \Log::info("🔍 Processing order: " . $order->document_number);

                $itemsWithPrice = [];
                $totalValue = 0;

                if ($order->items && $order->items->count() > 0) {
                    foreach ($order->items as $item) {
                        // ค้นหา store_item
                        $storeItem = \App\Models\StoreItem::where('good_id', $item->product_id)
                            ->orWhere('id', $item->product_id)
                            ->first();

                        $price = 0;
                        $quantity = floatval($item->quantity ?? 0);

                        if ($storeItem) {
                            $price = floatval($storeItem->price ?? 0);
                        }

                        $itemTotal = $price * $quantity;
                        $totalValue += $itemTotal;

                        $itemsWithPrice[] = [
                            'product_id' => $item->product_id,
                            'good_code' => $storeItem->good_code ?? 'ไม่พบข้อมูล',
                            'good_id' => $storeItem->good_id ?? 'ไม่พบข้อมูล',
                            'quantity' => $quantity,
                            'price' => $price,
                            'total_price' => $itemTotal
                        ];
                    }
                }

                $result[] = [
                    'document_number' => $order->document_number ?? 'ไม่ระบุ',
                    'department' => $order->department ?? 'ไม่ระบุ',
                    'requester' => $order->requester ?? 'ไม่ระบุ',
                    'user_approved' => $order->user_approved ?? 'ไม่ระบุ',
                    'itemsCount' => $order->items ? $order->items->count() : 0,
                    'totalValue' => $totalValue,
                    'order_date' => $order->updated_at ? $order->updated_at->format('Y-m-d H:i') : null,
                    'status' => $order->status ?? 'ไม่ระบุ',
                    'note' => $order->note ?? '',
                    'items' => $itemsWithPrice
                ];
            }

            \Log::info('✅ Final recent approvals data prepared');
            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('❌ Error in recentApprovals: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch recent approvals',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function Departments(Request $request)
    {
        try {
            $timeRange = $request->input('timeRange', 'month');
            $selectedDate = $request->input('selectedDate'); // อาจเป็น d/m/yyyy หรือ YYYY-MM-DD
            $dateRange = $request->input('dateRange', []);   // อาจเป็น ['d/m/yyyy', 'd/m/yyyy'] หรือ ['YYYY-MM-DD', 'YYYY-MM-DD']

            // ฟังก์ชันแปลง d/m/yyyy พ.ศ. → YYYY-MM-DD ค.ศ.
            $toCE = function ($thaiDate) {
                if (!$thaiDate) return null;

                if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $thaiDate)) {
                    [$d, $m, $y] = explode('/', $thaiDate);
                    $yearCE = (int)$y - 543;
                    return sprintf('%04d-%02d-%02d', $yearCE, $m, $d);
                }

                return $thaiDate; // assume already YYYY-MM-DD
            };

            $startDate = isset($dateRange[0]) ? $toCE($dateRange[0]) : null;
            $endDate   = isset($dateRange[1]) ? $toCE($dateRange[1]) : null;
            $selectedDate = $toCE($selectedDate);

            $query = DB::table('store_orders')
                ->select('id', 'document_number', 'order_date', 'status', 'department', 'requester', 'note')
                ->where('status', 'approved');

            switch ($timeRange) {
                case 'day':
                    if ($selectedDate) {
                        $query->whereDate('order_date', $selectedDate);
                    }
                    break;

                case 'month':
                    $year = date('Y');
                    $month = date('m');
                    $query->whereYear('order_date', $year)
                        ->whereMonth('order_date', $month);
                    break;

                case 'year':
                    $query->whereYear('order_date', date('Y'));
                    break;

                case 'custom':
                    if ($selectedDate) {
                        $query->whereDate('order_date', $selectedDate);
                    } elseif ($startDate && $endDate) {
                        if ($startDate === $endDate) {
                            // วันเดียว ใช้ whereDate
                            $query->whereDate('order_date', $startDate);
                        } else {
                            // ช่วงวัน ใช้ startOfDay & endOfDay
                            $query->whereBetween('order_date', [
                                \Carbon\Carbon::parse($startDate)->startOfDay(),
                                \Carbon\Carbon::parse($endDate)->endOfDay(),
                            ]);
                        }
                    }
                    break;
            }

            $approvedOrders = $query->get();
            $departments = $approvedOrders->groupBy('department');

            return response()->json($departments);
        } catch (\Exception $e) {
            \Log::error('Error fetching approved orders: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }


public function ApprovedBudget(Request $request)
{
    try {
        $selectedDate = $request->input('selectedDate');        // string 'dd/mm/yyyy' หรือ 'yyyy-mm-dd'
        $dateRange    = $request->input('dateRange');          // ['dd/mm/yyyy', 'dd/mm/yyyy'] หรือ ['yyyy-mm-dd', 'yyyy-mm-dd']
        $all          = $request->boolean('all', false);
        $timeRange    = $request->input('timeRange', null);
        $startInput   = $request->input('startDate');          // Local datetime 'yyyy-mm-dd HH:mm:ss'
        $endInput     = $request->input('endDate');            // Local datetime 'yyyy-mm-dd HH:mm:ss'

        Log::info('📩 Incoming ApprovedBudget params', compact('selectedDate', 'dateRange', 'all', 'timeRange', 'startInput', 'endInput'));

        $query = StoreOrder::with(['items.storeItem'])
            ->where('status', 'approved');

        // --- Helper แปลง พ.ศ. → ค.ศ. ---
        $convertDateToCE = function (string $date) {
            if (str_contains($date, '/')) {
                [$day, $month, $year] = explode('/', $date);
                $yearCE = intval($year) - 543;
                return \Carbon\Carbon::create($yearCE, intval($month), intval($day));
            }
            return \Carbon\Carbon::parse($date);
        };

        $start = null;
        $end   = null;

        // --- All ---
        if ($all) {
            Log::info('📅 Fetching all approved orders (no date filter)');
        }
        // --- Single date ---
        elseif ($selectedDate) {
            $start = $convertDateToCE($selectedDate)->startOfDay();
            $end   = $convertDateToCE($selectedDate)->endOfDay();
            $query->whereBetween('order_date', [$start, $end]);
            Log::info('🔍 Filtering by single date', ['start' => $start, 'end' => $end]);
        }
        // --- Explicit start/end ---
        elseif ($startInput && $endInput) {
            $start = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $startInput);
            $end   = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $endInput);
            $query->whereBetween('order_date', [$start, $end]);
            Log::info('🔍 Filtering by explicit start/end', ['start' => $start, 'end' => $end]);
        }
        // --- Date range ---
        elseif ($dateRange && count($dateRange) === 2) {
            [$startDate, $endDate] = $dateRange;
            $start = $convertDateToCE($startDate)->startOfDay();
            $end   = $convertDateToCE($endDate)->endOfDay();
            $query->whereBetween('order_date', [$start, $end]);
            Log::info('🔍 Filtering by date range', ['start' => $start, 'end' => $end]);
        }
        // --- Fallback timeRange ---
        elseif ($timeRange) {
            $today = \Carbon\Carbon::today();
            switch ($timeRange) {
                case 'month':
                    $start = $today->copy()->firstOfMonth()->startOfDay();
                    $end   = $today->copy()->lastOfMonth()->endOfDay();
                    break;
                case 'quarter':
                    $quarter = ceil($today->month / 3);
                    $start = \Carbon\Carbon::create($today->year, ($quarter - 1) * 3 + 1, 1)->startOfDay();
                    $end   = $start->copy()->addMonths(3)->subDay()->endOfDay();
                    break;
                case 'year':
                    $start = $today->copy()->firstOfYear()->startOfDay();
                    $end   = $today->copy()->lastOfYear()->endOfDay();
                    break;
                default:
                    return response()->json(['success' => true, 'data' => []]);
            }
            $query->whereBetween('order_date', [$start, $end]);
            Log::info('🔍 Filtering by fallback timeRange', ['start' => $start, 'end' => $end]);
        } else {
            Log::info('⚠️ No date filter applied, returning empty');
            return response()->json(['success' => true, 'data' => []]);
        }

        $approvedOrders = $query->orderBy('order_date', 'desc')->get();
        Log::info('📊 Query result count:', ['count' => $approvedOrders->count()]);

        $result = $approvedOrders->map(function ($order) use ($start, $end) {
            $orderDate = \Carbon\Carbon::parse($order->order_date);
            if ($start && $end && ($orderDate->lt($start) || $orderDate->gt($end))) {
                return null;
            }

            return [
                'order_no'    => $order->document_number ?? '-',
                'status'      => $order->status,
                'approved_at' => $order->order_date,
                'items'       => $order->items->map(function ($item) {
                    $storeItem = $item->storeItem ?? ($item->good ? StoreItem::where('good_id', $item->good->GoodID)->first() : null);
                    return [
                        'product_id' => $item->product_id,
                        'good_id'    => $storeItem->good_id ?? '-',
                        'good_code'  => $storeItem->good_code ?? '-',
                        'quantity'   => (float)($item->quantity ?? 0),
                        'price'      => (float)($storeItem->price ?? 0),
                        'total'      => ((float)($item->quantity ?? 0)) * ((float)($storeItem->price ?? 0)),
                    ];
                }),
            ];
        })->filter(); // ลบ null ออก

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    } catch (\Exception $e) {
        Log::error('❌ ApprovedBudget error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        return response()->json([
            'success' => false,
            'message' => 'ไม่สามารถดึงข้อมูลงบประมาณได้',
        ], 500);
    }
}




    private function convertDateToCE(string $date): \Carbon\Carbon
    {
        if (str_contains($date, '/')) {
            [$day, $month, $year] = explode('/', $date);
            $yearCE = intval($year) - 543;
            return \Carbon\Carbon::create($yearCE, intval($month), intval($day));
        }
        return \Carbon\Carbon::parse($date);
    }

    public function nameOrder()
    {
        try {
            // \Log::info('🚀 Starting nameOrder - DEBUG ALL DATA');

            // 1. ตรวจสอบข้อมูลในตารางต่างๆ
            $debugInfo = [];

            // ตรวจสอบ store_orders
            $debugInfo['store_orders'] = DB::table('store_orders')
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->toArray();

            // ตรวจสอบ store_order_items
            $debugInfo['store_order_items'] = [
                'total_count' => DB::table('store_order_items')->count(),
                'sample_items' => DB::table('store_order_items')
                    ->select('id', 'store_order_id', 'product_id', 'quantity')
                    ->limit(4)
                    ->get()
                    ->toArray()
            ];

            // ตรวจสอบ store_items
            $debugInfo['store_items'] = [
                'total_count' => DB::table('store_items')->count(),
                'sample_items' => DB::table('store_items')
                    ->select('id', 'good_code', 'good_id', 'stock_qty')
                    ->limit(4)
                    ->get()
                    ->toArray()
            ];

            // \Log::info('📊 Debug info:', $debugInfo);

            // 2. พยายาม join ข้อมูลทั้งหมดโดยไม่สนใจ status
            $products = DB::table('store_order_items as items')
                ->join('store_items as products', 'items.product_id', '=', 'products.id')
                ->select(
                    'products.id as product_table_id',
                    'products.good_code',
                    'products.good_id',
                    'products.GoodUnitID',
                    'products.stock_qty',
                    'products.safety_stock',
                    'products.price',
                    DB::raw('COUNT(*) as order_count'),
                    DB::raw('SUM(CAST(items.quantity as DECIMAL(18,2))) as total_quantity'),
                    DB::raw('AVG(CAST(items.quantity as DECIMAL(18,2))) as avg_quantity_per_order')
                )
                ->whereNotNull('products.good_code')
                ->where('products.good_code', '!=', '')
                ->groupBy(
                    'products.id',
                    'products.good_code',
                    'products.good_id',
                    'products.GoodUnitID',
                    'products.stock_qty',
                    'products.safety_stock',
                    'products.price'
                )
                ->orderByDesc('order_count')
                ->limit(5)
                ->get();

            // \Log::info('📊 Products found (no status filter): ' . $products->count());

            // 3. ถ้ายังไม่มีข้อมูล ให้ลองใช้ข้อมูลจาก store_order_items โดยตรง
            if ($products->isEmpty()) {
                // \Log::info('🔍 Join failed, trying direct product_id approach...');

                $directProducts = DB::table('store_order_items')
                    ->select(
                        'product_id',
                        DB::raw('COUNT(*) as order_count'),
                        DB::raw('SUM(CAST(quantity as DECIMAL(18,2))) as total_quantity')
                    )
                    ->whereNotNull('product_id')
                    ->groupBy('product_id')
                    ->orderByDesc('order_count')
                    ->limit(5)
                    ->get();

                // \Log::info('📊 Direct products by product_id: ' . $directProducts->count());

                // ถ้ามีข้อมูลจาก store_order_items ให้พยายามดึงข้อมูลจาก store_items ด้วย
                if ($directProducts->isNotEmpty()) {
                    $productIds = $directProducts->pluck('product_id')->toArray();

                    $storeItems = DB::table('store_items')
                        ->whereIn('id', $productIds)
                        ->select('id', 'good_code', 'good_id', 'GoodUnitID', 'stock_qty', 'safety_stock', 'price')
                        ->get()
                        ->keyBy('id');

                    $products = $directProducts->map(function ($item) use ($storeItems) {
                        $storeItem = $storeItems[$item->product_id] ?? null;

                        if ($storeItem) {
                            return (object) [
                                'product_table_id' => $storeItem->id,
                                'good_code' => $storeItem->good_code,
                                'good_id' => $storeItem->good_id,
                                'GoodUnitID' => $storeItem->GoodUnitID,
                                'stock_qty' => $storeItem->stock_qty,
                                'safety_stock' => $storeItem->safety_stock,
                                'price' => $storeItem->price,
                                'order_count' => $item->order_count,
                                'total_quantity' => $item->total_quantity,
                                'avg_quantity_per_order' => $item->total_quantity / $item->order_count
                            ];
                        } else {
                            return (object) [
                                'product_table_id' => $item->product_id,
                                'good_code' => 'PID-' . $item->product_id,
                                'good_id' => $item->product_id,
                                'GoodUnitID' => null,
                                'stock_qty' => 0,
                                'safety_stock' => 0,
                                'price' => 0,
                                'order_count' => $item->order_count,
                                'total_quantity' => $item->total_quantity,
                                'avg_quantity_per_order' => $item->total_quantity / $item->order_count
                            ];
                        }
                    });
                }
            }

            // 4. ดึงชื่อสินค้าจาก EMGood
            $productDetails = [];
            if ($products->isNotEmpty()) {
                $allGoodIds = $products->pluck('good_id')->filter()->map(function ($id) {
                    return (string) $id;
                })->toArray();

                $allGoodCodes = $products->pluck('good_code')->filter()->toArray();

                // \Log::info('🔍 EMGood lookup - GoodIDs: ' . json_encode($allGoodIds));
                // \Log::info('🔍 EMGood lookup - GoodCodes: ' . json_encode($allGoodCodes));

                try {
                    // ค้นหาด้วย GoodID
                    if (!empty($allGoodIds)) {
                        $detailsById = DB::connection('sqlsrv2')
                            ->table('EMGood')
                            ->whereIn('GoodID', $allGoodIds)
                            ->select('GoodID', 'GoodCode', 'GoodName1')
                            ->get();

                        foreach ($detailsById as $item) {
                            $productDetails[$item->GoodID] = [
                                'good_name' => $item->GoodName1,
                                'good_code' => $item->GoodCode
                            ];
                        }
                    }

                    // ค้นหาด้วย GoodCode
                    if (!empty($allGoodCodes)) {
                        $detailsByCode = DB::connection('sqlsrv2')
                            ->table('EMGood')
                            ->whereIn('GoodCode', $allGoodCodes)
                            ->select('GoodID', 'GoodCode', 'GoodName1')
                            ->get();

                        foreach ($detailsByCode as $item) {
                            $productDetails[$item->GoodCode] = [
                                'good_name' => $item->GoodName1,
                                'good_id' => $item->GoodID
                            ];
                        }
                    }

                    // \Log::info('📦 EMGood names found: ' . count($productDetails));
                } catch (\Exception $e) {
                    // \Log::error('❌ EMGood query failed: ' . $e->getMessage());
                }
            }

            // 5. จัดรูปแบบข้อมูลสุดท้าย
            $formattedProducts = $products->map(function ($item) use ($productDetails) {
                $details = $productDetails[$item->good_id] ?? $productDetails[$item->good_code] ?? null;

                $goodName = $details['good_name'] ?? "สินค้า {$item->good_code}";

                $trend = 'stable';
                if ($item->order_count > 10) {
                    $trend = 'up';
                } elseif ($item->order_count < 3) {
                    $trend = 'down';
                }

                $stock_status = 'normal';
                if ($item->stock_qty <= $item->safety_stock) {
                    $stock_status = 'low';
                } elseif ($item->stock_qty <= ($item->safety_stock * 1.5)) {
                    $stock_status = 'warning';
                }

                return [
                    'product_table_id' => $item->product_table_id,
                    'good_code' => $item->good_code,
                    'good_id' => $item->good_id,
                    'good_name' => $goodName,
                    'order_count' => (int) $item->order_count,
                    'total_quantity' => (float) $item->total_quantity,
                    'avg_quantity_per_order' => round((float) $item->avg_quantity_per_order, 2),
                    'current_stock' => (float) $item->stock_qty,
                    'safety_stock' => (float) $item->safety_stock,
                    'price' => (float) $item->price,
                    'stock_status' => $stock_status,
                    'good_unit_id' => $item->GoodUnitID,
                    'trend' => $trend
                ];
            });

            // \Log::info('🎯 Final debug result: ' . $formattedProducts->count() . ' products');

            return response()->json([
                'success' => true,
                'data' => $formattedProducts,
                'total_products' => $formattedProducts->count(),
                'message' => $formattedProducts->count() > 0
                    ? 'ดึงข้อมูลสินค้ายอดนิยมสำเร็จ'
                    : 'ไม่พบข้อมูลการสั่งซื้อสินค้าในระบบ',
                'debug' => $debugInfo // ส่ง debug info ไปด้วย
            ]);
        } catch (\Exception $e) {
            // \Log::error('❌ nameOrder error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function Chart(Request $request)
    {
        try {
            // ✅ รับพารามิเตอร์จาก front-end
            $selectedYear = $request->input('selectedYear');
            $selectedMonth = $request->input('selectedMonth');
            $dateMode = $request->input('dateMode');
            $startDate = $request->input('startDate');
            $endDate = $request->input('endDate');
            $timeRange = $request->input('timeRange');;

            // ✅ ใช้ Eloquent เหมือน Withdrawal API
            $query = StoreOrder::query()
                ->whereRaw("LOWER(LTRIM(RTRIM(status))) = 'approved'")
                ->whereNotNull('order_date');



            // ✅ ใช้ applyTimeFilter method เดียวกัน
            $this->applyTimeFilter($query, $timeRange, null, $startDate, $endDate);

            // \Log::info('🔍 Chart API - Using applyTimeFilter method', [
            //     'timeRange' => $timeRange,
            //     'startDate' => $startDate,
            //     'endDate' => $endDate
            // ]);


            $orders = $query->select(
                'id',
                'document_number',
                'department',
                'status',
                'requester',
                'note',
                'order_date',
                DB::raw("CONVERT(varchar(7), order_date, 120) as month"),
                DB::raw("CONVERT(date, order_date) as order_date_only")
            )
                ->orderBy('order_date', 'desc')
                ->get();



            // ... ส่วนที่เหลือเหมือนเดิม
            $orderItems = DB::table('store_order_items')
                ->leftJoin('store_items', 'store_order_items.product_id', '=', 'store_items.good_id')
                ->whereIn('store_order_items.store_order_id', $orders->pluck('id'))
                ->select(
                    'store_order_items.store_order_id',
                    'store_order_items.product_id',
                    'store_order_items.quantity',
                    'store_items.GoodUnitID',
                    'store_items.price',
                    DB::raw('CAST(store_order_items.quantity AS DECIMAL(10,2)) * CAST(ISNULL(store_items.price, 0) AS DECIMAL(10,2)) as total_price')
                )
                ->get()
                ->groupBy('store_order_id');

            $combinedData = $orders->map(function ($order) use ($orderItems) {
                $items = $orderItems->get($order->id, collect());
                return [
                    'id' => $order->id,
                    'document_number' => $order->document_number,
                    'department' => $order->department,
                    'status' => $order->status,
                    'requester' => $order->requester,
                    'note' => $order->note,
                    'order_date' => $order->order_date,
                    'order_date_only' => $order->order_date_only,
                    'month' => $order->month,
                    'items' => $items->map(function ($item) {
                        return [
                            'product_id' => $item->product_id,
                            'quantity' => $item->quantity,
                            'GoodUnitID' => $item->GoodUnitID,
                            'price' => $item->price,
                            'total_price' => $item->total_price,
                        ];
                    }),
                    'total_quantity' => $items->sum('quantity'),
                    'total_price' => $items->sum('total_price'),
                ];
            });

            // ตรวจสอบข้อมูลที่ได้
            $monthsInData = $combinedData->pluck('month')->unique()->values();

            $sortedData = $combinedData->sortBy('order_date');
            $dateRangeInData = $combinedData->count() > 0 ? [
                'min_date' => $sortedData->first()['order_date'],
                'max_date' => $sortedData->last()['order_date']
            ] : null;



            return response()->json([
                'success' => true,
                'message' => 'ดึงข้อมูลสำเร็จ',
                'count' => $combinedData->count(),
                'date_range' => $dateRangeInData,
                'months_in_data' => $monthsInData,
                'parameters_used' => compact(
                    'selectedYear',
                    'selectedMonth',
                    'dateMode',
                    'startDate',
                    'endDate',
                    'timeRange'
                ),
                'data' => $combinedData,
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' . $e->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    private function applyTimeFilter($query, $range, $date, $startDate, $endDate)
    {
        // \Log::info('🕐 Applying Time Filter', compact('range', 'date', 'startDate', 'endDate'));

        $now = now();

        switch ($range) {
            case 'day':
                $query->whereDate('order_date', $now->toDateString());
                break;
            case 'week':
                $query->whereDate('order_date', '>=', $now->copy()->startOfWeek()->format('Y-m-d'))
                    ->whereDate('order_date', '<=', $now->copy()->endOfWeek()->format('Y-m-d'));
                break;
            case 'month':
                $query->whereDate('order_date', '>=', $now->copy()->startOfMonth()->format('Y-m-d'))
                    ->whereDate('order_date', '<=', $now->copy()->endOfMonth()->format('Y-m-d'));
                break;
            case 'quarter':
                $query->whereDate('order_date', '>=', $now->copy()->startOfQuarter()->format('Y-m-d'))
                    ->whereDate('order_date', '<=', $now->copy()->endOfQuarter()->format('Y-m-d'));
                break;
            case 'year':
                $query->whereDate('order_date', '>=', $now->copy()->startOfYear()->format('Y-m-d'))
                    ->whereDate('order_date', '<=', $now->copy()->endOfYear()->format('Y-m-d'));
                break;
            case 'custom':
                if ($date) {
                    $query->whereDate('order_date', $date);
                } elseif ($startDate && $endDate) {
                    $query->whereDate('order_date', '>=', $startDate)
                        ->whereDate('order_date', '<=', $endDate);
                }
                break;
            case 'all':
                // ไม่กรองวันที่
                break;
            default:
                $query->whereDate('order_date', '>=', $now->copy()->startOfMonth()->format('Y-m-d'))
                    ->whereDate('order_date', '<=', $now->copy()->endOfMonth()->format('Y-m-d'));
        }

        // \Log::info('✅ Applied Time Filter with whereDate', [
        //     'range' => $range,
        //     'method' => 'whereDate',
        //     'timezone' => config('app.timezone')
        // ]);
    }


    public function Data()
    {
        try {
            // ดึงข้อมูลคำสั่งเบิกพร้อมรายละเอียดสินค้า
            $orders = DB::table('store_orders')
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->leftJoin('store_items', function ($join) {
                    $join->on('store_order_items.product_id', '=', 'store_items.good_id');
                })
                ->select(
                    'store_orders.id',
                    'store_orders.document_number',
                    'store_orders.department',
                    'store_orders.status',
                    'store_orders.requester',
                    'store_orders.note',
                    'store_orders.order_date',
                    'store_order_items.product_id',
                    'store_order_items.quantity',
                    'store_items.GoodUnitID',
                    'store_items.price',
                    DB::raw("CONVERT(varchar(7), store_orders.order_date, 120) as month") // YYYY-MM
                )
                ->orderBy('store_orders.order_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'ดึงข้อมูลสำเร็จ',
                'count' => $orders->count(),
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    // StoreOrderController.php
    public function QuickSummary()
    {
        try {
            $timeRange = request('timeRange', date('Y'));

            // ตรวจสอบและปรับปี
            if (!$timeRange || !preg_match('/^\d{4}$/', $timeRange)) {
                $timeRange = date('Y');
            }

            $originalYear = $timeRange;
            if ($timeRange > date('Y')) {
                $timeRange = date('Y');
            }

            // ตั้งค่า range ปีนี้
            $startDate = $timeRange . '-01-01';
            $endDate = $timeRange . '-12-31';

            \Log::info("Querying for year: {$timeRange}");

            // 1. ดึงข้อมูลการเบิกสินค้าจาก store_orders (เฉพาะคำสั่งเบิกที่ approved) - ปีนี้
            $approvedCondition = "LOWER(LTRIM(RTRIM(status))) = 'approved'";

            // 2. คำนวณมูลค่าสินค้าที่เบิกไปแล้ว (เฉพาะ approved) - ข้อมูลจริงปีนี้
            $totalUsedValue = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->leftJoin('store_items', 'store_order_items.product_id', '=', 'store_items.good_id')
                ->select(DB::raw('SUM(CAST(store_order_items.quantity AS DECIMAL(10,2)) * CAST(ISNULL(store_items.price, 0) AS DECIMAL(10,2))) as total_value'))
                ->value('total_value') ?? 0;

            // 3. คำนวณจำนวนรายการสินค้าที่เบิก (approved) - ข้อมูลจริงปีนี้
            $totalUsedItems = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->count();

            // 4. คำนวณจำนวนชิ้นสินค้าที่เบิกไปแล้ว (เฉพาะ approved) - ข้อมูลจริงปีนี้
            $totalUsedQuantity = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->sum(DB::raw('CAST(store_order_items.quantity AS DECIMAL(10,2))'));

            // 5. นับจำนวนคำสั่งเบิกทั้งหมดที่ approved
            $totalApprovedOrders = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->count();

            // 6. ดึงข้อมูลสินค้าคงคลังจาก store_items
            $totalStockItems = DB::table('store_items')->count();
            $totalStockValue = DB::table('store_items')
                ->selectRaw('SUM(stock_qty * price) as total_value')
                ->value('total_value') ?? 0;
            $totalStockQty = DB::table('store_items')->sum('stock_qty');
            $totalSafetyStock = DB::table('store_items')->sum('safety_stock');

            // 7. คำนวณอัตราการใช้งาน (ใช้มูลค่าแทนจำนวนชิ้น)
            $usageRate = 0;
            if ($totalStockValue > 0 && $totalUsedValue > 0) {
                $usageRate = round(($totalUsedValue / $totalStockValue) * 100, 2);
            }

            // 8. 🔥 ดึงข้อมูลปีที่แล้วจริงจาก database
            $previousYear = $timeRange - 1;
            $prevStartDate = $previousYear . '-01-01';
            $prevEndDate = $previousYear . '-12-31';

            // คำนวณมูลค่าปีที่แล้ว
            $prevTotalUsedValue = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$prevStartDate, $prevEndDate])
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->leftJoin('store_items', 'store_order_items.product_id', '=', 'store_items.good_id')
                ->select(DB::raw('SUM(CAST(store_order_items.quantity AS DECIMAL(10,2)) * CAST(ISNULL(store_items.price, 0) AS DECIMAL(10,2))) as total_value'))
                ->value('total_value') ?? 0;

            // คำนวณจำนวนรายการปีที่แล้ว
            $prevTotalUsedItems = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$prevStartDate, $prevEndDate])
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->count();

            // คำนวณจำนวนชิ้นปีที่แล้ว
            $prevTotalUsedQuantity = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$prevStartDate, $prevEndDate])
                ->join('store_order_items', 'store_orders.id', '=', 'store_order_items.store_order_id')
                ->sum(DB::raw('CAST(store_order_items.quantity AS DECIMAL(10,2))'));

            // นับจำนวนคำสั่งปีที่แล้ว
            $prevTotalUsedOrders = DB::table('store_orders')
                ->whereRaw($approvedCondition)
                ->whereBetween('order_date', [$prevStartDate, $prevEndDate])
                ->count();

            // 9. คำนวณอัตราการเติบโตเปรียบเทียบกับปีที่แล้ว (ใช้มูลค่า)
            $comparisonRate = 0;
            if ($prevTotalUsedValue > 0 && $totalUsedValue > 0) {
                $comparisonRate = round((($totalUsedValue - $prevTotalUsedValue) / $prevTotalUsedValue) * 100, 2);
            } elseif ($prevTotalUsedValue == 0 && $totalUsedValue > 0) {
                // ถ้าปีที่แล้วเป็น 0 แต่ปีนี้มีข้อมูล = เติบโต 100%
                $comparisonRate = 100;
            }

            \Log::info("Comparison - This Year: {$totalUsedValue}, Previous Year: {$prevTotalUsedValue}, Rate: {$comparisonRate}%");

            return response()->json([
                'success' => true,
                'timeRange' => $timeRange,
                'originalYear' => $originalYear,
                'startDate' => $startDate,
                'endDate' => $endDate,
                'totalUsed' => (float)$totalUsedValue,        // ✅ เปลี่ยนเป็นมูลค่าที่เบิกไปแล้ว (approved) - จริง
                'totalRemaining' => (float)$totalStockValue,  // ✅ เปลี่ยนเป็นมูลค่าสินค้าคงเหลือในสต็อก - จริง
                'usageRate' => $usageRate,                    // อัตราการใช้งาน (ใช้มูลค่า) - จริง
                'comparisonRate' => $comparisonRate,          // อัตราการเติบโต (เปรียบเทียบมูลค่ากับปีที่แล้วจริง)
                'totalItems' => (int)$totalUsedItems,         // จำนวนรายการสินค้าที่เบิก (approved) - จริง
                'totalValue' => (float)$totalUsedValue,       // มูลค่าสินค้าที่เบิกไปแล้ว (approved) - จริง
                'totalOrders' => (int)$totalApprovedOrders,   // จำนวนคำสั่งเบิกที่ approved - จริง
                'isFutureYear' => $originalYear > date('Y'),
                'previousYearData' => [                       // 🔥 ข้อมูลปีที่แล้ว (จริงจาก database)
                    'year' => $previousYear,
                    'totalUsed' => (float)$prevTotalUsedValue,    // ✅ เปลี่ยนเป็นมูลค่า
                    'totalValue' => (float)$prevTotalUsedValue,   // ✅ เปลี่ยนเป็นมูลค่า
                    'totalOrders' => (int)$prevTotalUsedOrders,
                    'totalItems' => (int)$prevTotalUsedItems,
                    'hasData' => $prevTotalUsedValue > 0 // บอกว่ามีข้อมูลปีที่แล้วหรือไม่
                ],
                'debug' => [
                    'withdrawal_value' => $totalUsedValue,        // ✅ เปลี่ยนเป็นมูลค่า
                    'withdrawal_quantity' => $totalUsedQuantity,  // เก็บจำนวนชิ้นไว้สำหรับ reference
                    'withdrawal_orders' => $totalApprovedOrders,
                    'withdrawal_items' => $totalUsedItems,
                    'stock_value' => $totalStockValue,            // ✅ เปลี่ยนเป็นมูลค่า
                    'stock_quantity' => $totalStockQty,           // เก็บจำนวนชิ้นไว้สำหรับ reference
                    'stock_items' => $totalStockItems,
                    'approved_condition' => $approvedCondition,
                    'previous_year_data' => [
                        'value' => $prevTotalUsedValue,           // ✅ เปลี่ยนเป็นมูลค่า
                        'quantity' => $prevTotalUsedQuantity,     // เก็บจำนวนชิ้นไว้สำหรับ reference
                        'orders' => $prevTotalUsedOrders,
                        'has_data' => $prevTotalUsedValue > 0
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("QuickSummary error: " . $e->getMessage());
            \Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }



    private function convertToCE($date, $startOfDay = true)
    {
        try {
            if (str_contains($date, '/')) {
                [$day, $month, $year] = explode('/', $date);
                $year = intval($year) - 543;
                $carbon = \Carbon\Carbon::create($year, $month, $day);
            } else {
                $carbon = \Carbon\Carbon::parse($date);
            }
            return $startOfDay ? $carbon->startOfDay() : $carbon->endOfDay();
        } catch (\Exception $e) {
            Log::error('❌ convertToCE failed for date: ' . $date, ['error' => $e->getMessage()]);
            return null;
        }
    }
}
