<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductStockReportController extends Controller
{
    protected $poService;
    
    public function __construct(\App\Services\Dashboard\POInvDashboardService $poService)
    {
        $this->poService = $poService;
    }

    /**
     * ดึงข้อมูล Stock สินค้าและราคามูลค่าคงคลัง
     */
    public function getProductStockSummary(Request $request)
    {
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));
        $targetDate = Carbon::parse($date);
        
        // ช่วงเวลาสำหรับหาราคาเฉลี่ย (เริ่มเดือนถึงเป้าหมาย)
        $startOfMonth = $targetDate->copy()->startOfMonth();
        $endOfPeriod = $targetDate->copy();

        // 1. ดึงข้อมูล Stock ล่าสุด
        $stockProducts = DB::table('stock_products')
            ->whereDate('record_date', '<=', $targetDate)
            ->orderBy('record_date', 'desc')
            ->first();

        $cpoStock = DB::table('cpo_data')
            ->whereDate('date', '<=', $targetDate)
            ->orderBy('date', 'desc')
            ->first();

        // 2. รายชื่อสินค้าและ GoodID สำหรับหาราคา (sqlsrv2)
        $productMappings = [
            'cpo' => [
                'name' => 'Crude Palm Oil',
                'good_id' => 2147,
                'qty' => (float)($cpoStock->total_cpo ?? 0),
                'unit' => 'Tons'
            ],
            'pkn' => [
                'name' => 'Palm Kernel',
                'good_id' => 2152,
                'qty' => (float)($stockProducts->pkn ?? 0),
                'unit' => 'Tons'
            ],
            'efb_fiber' => [
                'name' => 'EFB Fiber',
                'good_id' => 9012,
                'qty' => (float)($stockProducts->efb_fiber ?? 0),
                'unit' => 'Tons'
            ],
            'shell' => [
                'name' => 'Palm Shell',
                'good_id' => 2151,
                'qty' => (float)($stockProducts->shell ?? 0),
                'unit' => 'Tons'
            ],
            'nut' => [
                'name' => 'Palm Nut',
                'good_id' => 2150,
                'qty' => ((float)($stockProducts->nut ?? 0) + (float)($stockProducts->nut_out ?? 0)),
                'unit' => 'Tons'
            ],
            'silo1' => [
                'name' => 'PKN Silo',
                'good_id' => 2152,
                'qty' => (float)($stockProducts->silo_1 ?? 0),
                'unit' => 'Tons'
            ],
            'silo2' => [
                'name' => 'PKN Silo',
                'good_id' => 2152,
                'qty' => (float)($stockProducts->silo_2 ?? 0),
                'unit' => 'Tons'
            ],
            'silo' => [
                'name' => 'PKN Silo',
                'good_id' => 2152,
                'qty' => (float)($stockProducts->silo_1 ?? 0) + (float)($stockProducts->silo_2 ?? 0),
                'unit' => 'Tons'
            ]
        ];

        // 3. ดึงข้อมูล Trend ย้อนหลัง 7 วัน
        $stockTrends = DB::table('stock_products')
            ->whereDate('record_date', '<=', $targetDate)
            ->orderBy('record_date', 'desc')
            ->limit(7)
            ->get()
            ->reverse()
            ->values();

        $cpoTrends = DB::table('cpo_data')
            ->whereDate('date', '<=', $targetDate)
            ->orderBy('date', 'desc')
            ->limit(7)
            ->get()
            ->reverse()
            ->values();

        // 4. คำนวณราคาเฉลี่ยต่อหน่วยและมูลค่า
        $summary = [];
        $totalInventoryValue = 0;

        foreach ($productMappings as $key => $item) {
            $avgPrice = 0;

            // Try to pull average price from Delivery Plan
            $today = now()->toDateString();
            $orderData = DB::table('orders as o')
                ->leftJoin(DB::raw("(SELECT order_id, SUM(quantity) as delivered_qty FROM delivery_plan_items WHERE plan_date < '{$today}' GROUP BY order_id) as delivered"), 'o.id', '=', 'delivered.order_id')
                ->where('o.good_id', $item['good_id'])
                ->where(function ($q) {
                    $q->where('o.is_completed', 0)->orWhereNull('o.is_completed');
                })
                ->selectRaw('SUM(CASE WHEN o.quantity > COALESCE(delivered.delivered_qty, 0) THEN (o.quantity - COALESCE(delivered.delivered_qty, 0)) * o.price_sell ELSE 0 END) as total_revenue')
                ->selectRaw('SUM(CASE WHEN o.quantity > COALESCE(delivered.delivered_qty, 0) THEN (o.quantity - COALESCE(delivered.delivered_qty, 0)) ELSE 0 END) as total_qty')
                ->first();

            if ($orderData && $orderData->total_qty > 0) {
                $avgPrice = (float)($orderData->total_revenue / $orderData->total_qty);
            }

            if ($avgPrice <= 0) {
                $avgPrice = $this->getAvgSalesPrice($item['good_id'], $startOfMonth, $endOfPeriod);
            }

            $totalValue = $item['qty'] * $avgPrice * 1000;

            // Trend calculation
            $trend = [];
            if ($key === 'cpo') {
                foreach ($cpoTrends as $t) $trend[] = (float)$t->total_cpo;
            } else {
                foreach ($stockTrends as $t) {
                    if ($key === 'pkn') $trend[] = (float)$t->pkn;
                    else if ($key === 'efb_fiber') $trend[] = (float)$t->efb_fiber;
                    else if ($key === 'shell') $trend[] = (float)$t->shell;
                    else if ($key === 'nut') $trend[] = (float)($t->nut + $t->nut_out);
                    else if ($key === 'silo1') $trend[] = (float)$t->silo_1;
                    else if ($key === 'silo2') $trend[] = (float)$t->silo_2;
                    else if ($key === 'silo') $trend[] = (float)($t->silo_1 + $t->silo_2);
                }
            }

            $summary[$key] = array_merge($item, [
                'avg_price' => round($avgPrice, 2),
                'total_value' => round($totalValue, 2),
                'total_value_mb' => round($totalValue / 1000000, 3),
                'trend' => $trend
            ]);

            $totalInventoryValue += $totalValue;
        }

        // 4. ดึงข้อมูล FFB Remaining และอื่นๆ จาก POInvDashboardService
        $poData = $this->poService->getDashboardData($date);

        return response()->json([
            'success' => true,
            'date' => $targetDate->toDateString(),
            'period_start' => $startOfMonth->toDateString(),
            'total_inventory_value_mb' => round($totalInventoryValue / 1000000, 3),
            'items' => $summary,
            'remaining_stock' => $poData['remaining_stock'] ?? null
        ]);
    }

    /**
     * คำนวณราคาขายเฉลี่ยต่อ Kg จากระบบ ERP
     */
    protected function getAvgSalesPrice($goodId, $start, $end)
    {
        // ใช้ logic เดียวกับ ExecutiveProductionService
        $data = DB::connection('sqlsrv2')->table('SOInvDT')
            ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
            ->where('SOInvDT.GoodID', $goodId)
            ->whereBetween('SOInvHD.DocuDate', [$start->toDateString(), $end->toDateString()])
            ->whereIn('SOInvHD.DocuType', [107, 108])
            ->select(
                DB::raw('SUM(GoodAmnt) as total_amnt'),
                DB::raw('SUM(GoodStockQty) as total_qty')
            )->first();

        if ($data && $data->total_qty > 0) {
            return (float)($data->total_amnt / $data->total_qty);
        }

        // Fallback: หากทั้งเดือนยังไม่มีการขาย ให้ลองหาดูจากประวัติย้อนหลัง 3 เดือน
        $fallbackData = DB::connection('sqlsrv2')->table('SOInvDT')
            ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
            ->where('SOInvDT.GoodID', $goodId)
            ->whereBetween('SOInvHD.DocuDate', [$start->copy()->subMonths(3)->toDateString(), $end->toDateString()])
            ->whereIn('SOInvHD.DocuType', [107, 108])
            ->select(
                DB::raw('SUM(GoodAmnt) as total_amnt'),
                DB::raw('SUM(GoodStockQty) as total_qty')
            )->first();

        return $fallbackData && $fallbackData->total_qty > 0 ? (float)($fallbackData->total_amnt / $fallbackData->total_qty) : 0;
    }

    /**
     * CPO Supply Dashboard — Order คงเหลือ vs CPO ที่มี vs FFB ที่ต้องการ
     */
    public function getCpoSupplyDashboard(Request $request)
    {
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));
        $targetDate = Carbon::parse($date);

        // 1. CPO Order คงเหลือ (จาก Delivery Plan)
        $cpoGoodId = 2147;
        $today = now()->toDateString();

        $cpoOrders = DB::table('orders as o')
            ->leftJoin(
                DB::raw("(SELECT order_id, SUM(quantity) as delivered_qty FROM delivery_plan_items WHERE plan_date < '{$today}' GROUP BY order_id) as delivered"),
                'o.id', '=', 'delivered.order_id'
            )
            ->where('o.good_id', $cpoGoodId)
            ->where(function ($q) {
                $q->where('o.is_completed', 0)->orWhereNull('o.is_completed');
            })
            ->selectRaw('
                o.id,
                o.customer_name,
                o.quantity,
                o.price_sell,
                COALESCE(delivered.delivered_qty, 0) as delivered_qty,
                CASE WHEN o.quantity > COALESCE(delivered.delivered_qty, 0)
                    THEN (o.quantity - COALESCE(delivered.delivered_qty, 0))
                    ELSE 0 END as remaining_qty,
                CASE WHEN o.quantity > COALESCE(delivered.delivered_qty, 0)
                    THEN (o.quantity - COALESCE(delivered.delivered_qty, 0)) * 1000 * o.price_sell
                    ELSE 0 END as remaining_revenue
            ')
            ->get();

        $totalOrderRemainingQty = $cpoOrders->sum('remaining_qty');
        $totalOrderRemainingRevenue = $cpoOrders->sum('remaining_revenue');
        // avg_price = ยอดเงินรวม (฿) / (ปริมาณรวม (Tons) × 1000) = ฿/kg
        $avgOrderPrice = ($totalOrderRemainingQty * 1000) > 0
            ? $totalOrderRemainingRevenue / ($totalOrderRemainingQty * 1000)
            : 0;

        // 2. CPO Stock ปัจจุบัน (จาก cpo_data)
        $cpoStock = DB::table('cpo_data')
            ->whereDate('date', '<=', $targetDate)
            ->orderBy('date', 'desc')
            ->first();
        $cpoStockQty = (float)($cpoStock->total_cpo ?? 0);

        // 3. ข้อมูลปาล์มคงเหลือและ CPO โดยประมาณ (จาก POInvDashboardService)
        $poData = $this->poService->getDashboardData($date);
        $remainingStock = $poData['remaining_stock'] ?? null;
        $estimatedCpoQty = (float)($remainingStock['cpo_volume'] ?? 0);
        $yieldPercent    = (float)($remainingStock['yield_7d'] ?? 0);
        $palmVolume      = (float)($remainingStock['volume'] ?? 0);
        $palmAmountMb    = (float)($remainingStock['amount_mb'] ?? 0);
        $avgFfbPrice     = (float)($remainingStock['avg_ffb_price'] ?? 0); // ฿/kg

        // 4. CPO รวม = Stock + ประมาณ
        $totalCpoAvailable = $cpoStockQty + $estimatedCpoQty;

        // 5. CPO ขาด/เกิน = CPO รวม - Order คงเหลือ (บวก = เกิน, ลบ = ขาด)
        $cpoBalance = $totalCpoAvailable - $totalOrderRemainingQty;

        // 6. FFB ที่ต้องการเพิ่ม (เฉพาะกรณีขาด)
        $ffbRequired = 0;
        if ($cpoBalance < 0 && $yieldPercent > 0) {
            $ffbRequired = abs($cpoBalance) / ($yieldPercent / 100);
        }

        return response()->json([
            'success'   => true,
            'date'      => $targetDate->toDateString(),

            // Order คงเหลือ
            'order' => [
                'remaining_qty'     => round($totalOrderRemainingQty, 2),
                'remaining_revenue' => round($totalOrderRemainingRevenue, 2),
                'remaining_revenue_mb' => round($totalOrderRemainingRevenue / 1000000, 3),
                'avg_price'         => round($avgOrderPrice, 2),
                'orders'            => $cpoOrders->where('remaining_qty', '>', 0)->values(),
            ],

            // CPO ที่มี
            'cpo' => [
                'stock_qty'         => round($cpoStockQty, 2),
                'estimated_qty'     => round($estimatedCpoQty, 2),
                'total_available'   => round($totalCpoAvailable, 2),
                'balance'           => round($cpoBalance, 2),          // บวก = เกิน, ลบ = ขาด
                'balance_mb'        => round(($cpoBalance * $avgOrderPrice * 1000) / 1000000, 3),
            ],

            // ปาล์มคงเหลือ
            'palm' => [
                'volume'            => round($palmVolume, 2),
                'amount_mb'         => round($palmAmountMb, 3),
                'yield_percent'     => round($yieldPercent, 2),
                'ffb_required'      => round($ffbRequired, 2),
                'avg_ffb_price'     => round($avgFfbPrice, 2),
                // มูลค่าที่ต้องใช้ซื้อ FFB = ปริมาณ (Tons) × 1000 × ราคา (฿/kg) ÷ 1,000,000
                'ffb_cost_mb'       => round(($ffbRequired * 1000 * $avgFfbPrice) / 1000000, 3),
            ],
        ]);
    }
}

