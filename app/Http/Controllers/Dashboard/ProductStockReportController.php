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

        // 3. คำนวณราคาเฉลี่ยต่อหน่วยและมูลค่า
        $summary = [];
        $totalInventoryValue = 0;

        foreach ($productMappings as $key => $item) {
            $avgPrice = $this->getAvgSalesPrice($item['good_id'], $startOfMonth, $endOfPeriod);
            $totalValue = $item['qty'] * $avgPrice * 1000; // แปลง Tons -> Kg แล้วคูณราคา

            $summary[$key] = array_merge($item, [
                'avg_price' => round($avgPrice, 2),
                'total_value' => round($totalValue, 2),
                'total_value_mb' => round($totalValue / 1000000, 3)
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
}
