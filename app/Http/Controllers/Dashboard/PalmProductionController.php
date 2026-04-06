<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Carbon\Carbon;

class PalmProductionController extends Controller
{
    public function index()
{
    $summary = [
        'purchase_volume' => 120,
        'purchase_amount' => 450000,
        'avg_price' => 3750,
        'remaining_volume' => 300,
        'carry_over' => 100,
        'truck_count' => 25,
        'production_volume' => 90,
    ];

    $production = [
        ['name' => 'น้ำมันปาล์มดิบ', 'volume' => 16.2, 'percent' => 18],
        ['name' => 'เมล็ดในปาล์ม', 'volume' => 4.5, 'percent' => 5],
        ['name' => 'กะลาปาล์ม', 'volume' => 4.5, 'percent' => 5],
        ['name' => 'ทะลายปาล์มเปล่า', 'volume' => 17.1, 'percent' => 19],
    ];

    $dailyData = [
        ['date' => '1', 'volume' => 20],
        ['date' => '2', 'volume' => 15],
        ['date' => '3', 'volume' => 30],
        ['date' => '4', 'volume' => 25],
        ['date' => '5', 'volume' => 25],
        ['date' => '6', 'volume' => 25],
        ['date' => '7', 'volume' => 25],
        ['date' => '8', 'volume' => 25],
        ['date' => '9', 'volume' => 25],
    ];

    $monthlyData = [
        ['month' => 'ม.ค.', 'production' => 500, 'expected' => 520],
        ['month' => 'ก.พ.', 'production' => 450, 'expected' => 480],
        ['month' => 'มี.ค.', 'production' => 600, 'expected' => 590],
    ];

    return Inertia::render('Productions/Index', [
        'summary' => $summary,
        'production' => $production,
        'dailyData' => $dailyData,
        'monthlyData' => $monthlyData,
    ]);
    }

    public function getProductionSummaryCardApi(Request $request)
    {
        try {
            $startDateInput = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
            $endDateInput = $request->input('end_date', Carbon::today()->format('Y-m-d'));
            
            $startDate = Carbon::parse($startDateInput)->format('Y-m-d');
            $endDate = Carbon::parse($endDateInput)->format('Y-m-d');
            
            $carbonEndDate = Carbon::parse($endDate);
            $currentMonth = $carbonEndDate->month;
            $currentYear = $carbonEndDate->year;

            $baseQuery = function() {
                return DB::connection('sqlsrv3')
                    ->table('productions');
            };

            // Period (ช่วงเวลาที่เลือก)
            $periodStats = $baseQuery()
                ->whereDate('Date', '>=', $startDate)
                ->whereDate('Date', '<=', $endDate)
                ->select(
                    DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                    DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty'),
                    DB::raw('ISNULL(SUM(FFBPurchase), 0) as purchase_qty')
                )->first();

            // Today (ใช้วันที่ end_date) - ดึง FFBRemain ของวันนั้นมาด้วย
            $todayStats = $baseQuery()
                ->whereDate('Date', $endDate)
                ->select(
                    DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                    DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty'),
                    DB::raw('ISNULL(SUM(FFBPurchase), 0) as purchase_qty'),
                    DB::raw('ISNULL(MAX(FFBRemain), 0) as ffb_remain')
                )->first();

            // ถ้าวันนี้ไม่มีข้อมูล ให้หา FFBRemain ล่าสุดที่มี
            if (!$todayStats || $todayStats->ffb_remain == 0) {
                $latestRemain = $baseQuery()
                    ->whereDate('Date', '<=', $endDate)
                    ->orderBy('Date', 'desc')
                    ->select('FFBRemain')
                    ->first();
                if ($latestRemain) {
                    $todayStats->ffb_remain = $latestRemain->FFBRemain;
                }
            }

            // Monthly
            $monthStats = $baseQuery()
                ->whereYear('Date', $currentYear)
                ->whereMonth('Date', $currentMonth)
                ->select(
                    DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                    DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty'),
                    DB::raw('ISNULL(SUM(FFBPurchase), 0) as purchase_qty')
                )->first();

            // Yearly
            $yearStats = $baseQuery()
                ->whereYear('Date', $currentYear)
                ->select(
                    DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                    DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty'),
                    DB::raw('ISNULL(SUM(FFBPurchase), 0) as purchase_qty')
                )->first();

            return response()->json([
                'status' => 'success',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'data' => [
                    'period' => [
                        'total_ffb' => round((float)$periodStats->total_ffb, 3),
                        'good_qty' => round((float)$periodStats->good_qty, 3),
                        'purchase_qty' => round((float)$periodStats->purchase_qty, 3)
                    ],
                    'today' => [
                        'total_ffb' => round((float)$todayStats->total_ffb, 3),
                        'good_qty' => round((float)$todayStats->good_qty, 3),
                        'purchase_qty' => round((float)$todayStats->purchase_qty, 3),
                        'ffb_remain' => round((float)($todayStats->ffb_remain ?? 0), 3)
                    ],
                    'monthly' => [
                        'total_ffb' => round((float)$monthStats->total_ffb, 3),
                        'good_qty' => round((float)$monthStats->good_qty, 3),
                        'purchase_qty' => round((float)$monthStats->purchase_qty, 3)
                    ],
                    'yearly' => [
                        'total_ffb' => round((float)$yearStats->total_ffb, 3),
                        'good_qty' => round((float)$yearStats->good_qty, 3),
                        'purchase_qty' => round((float)$yearStats->purchase_qty, 3)
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * ดึงข้อมูลสรุป CPO (Stock + Yield + Tank Breakdown)
     * ข้อมูลหลักมาจาก cpo_data และคำนวณ Yield ร่วมกับ productions (FFBGoodQty)
     */
    public function getCPOSummaryApi(Request $request)
    {
        try {
            $startDateInput = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
            $endDateInput = $request->input('end_date', Carbon::today()->format('Y-m-d'));
            
            $startDate = Carbon::parse($startDateInput);
            $endDate = Carbon::parse($endDateInput);
            
            // 1. ดึงข้อมูลจาก cpo_data 
            $allCpoData = DB::table('cpo_data')
                ->orderBy('id', 'desc')
                ->get();

            $cpoData = null; // ข้อมูลล่าสุด ณ วันที่ endDate
            $periodProductCPONoOilRoom = 0; // ผลรวมผลิต (ไม่รวม oil room)
            $periodProductCPOWithOilRoom = 0; // ผลรวมผลิต (รวม oil room)

            foreach ($allCpoData as $row) {
                // ทำความสะอาดวันที่: "Apr  5 2026 12:00:00:AM" -> "Apr  5 2026"
                $cleanDateStr = substr($row->date, 0, 11);
                try {
                    $rowDate = Carbon::parse($cleanDateStr);
                    
                    // หาข้อมูลล่าสุดของวัน endDate (หรือวันล่าสุดก่อนหน้า)
                    if (!$cpoData && $rowDate->lte($endDate)) {
                        $cpoData = $row;
                    }

                    // สะสมยอดเพื่อคำนวณ Yield รายคาบ (Period)
                    if ($rowDate->gte($startDate) && $rowDate->lte($endDate)) {
                        $periodProductCPONoOilRoom += (float)($row->product_cpo ?? 0);
                        $periodProductCPOWithOilRoom += (float)($row->product_cpo ?? 0) + (float)($row->cpo_oil_room ?? 0);
                    }

                } catch (\Exception $e) {
                    continue;
                }
            }

            // 2. คำนวณ Yield ตามสูตรใหม่ (Sales + Change in Stock)
            // 2.1 ดึง Opening Stock (total_cpo ของวันก่อนหน้า startDate)
            $openingStockData = DB::table('cpo_data')
                ->whereDate('date', '<', $startDate->format('Y-m-d'))
                ->orderBy('date', 'desc')
                ->first();
            $openingStock = (float)($openingStockData->total_cpo ?? 0);

            // 2.2 ดึง Closing Stock & Oil Room Stock (ณ วันที่ล่าสุดในชุดข้อมูลที่เลือก)
            $closingStock = (float)($cpoData->total_cpo ?? 0);
            $latestOilRoom = (float)($cpoData->cpo_oil_room ?? 0);

            // 2.3 ดึงยอดขาย CPO (Item 2147) ในช่วงเวลาที่เลือก (Period Sales)
            $periodCpoSales = DB::connection('sqlsrv2')
                ->table('SOInvDT')
                ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
                ->where('SOInvDT.GoodID', 2147) // CPO
                ->whereIn('SOInvHD.DocuType', [107, 108])
                ->whereDate('SOInvHD.DocuDate', '>=', $startDate->format('Y-m-d'))
                ->whereDate('SOInvHD.DocuDate', '<=', $endDate->format('Y-m-d'))
                ->sum(DB::raw('GoodStockQty / 1000.0'));

            // 2.4 คำนวณ Yield รายคาบ (Period Yield)
            $yieldPeriod = 0;
            $yieldWithOilRoom = 0; // ยอดรวม Yield + Oil Room รายคาบ
            $yieldPeriodNoOilRoom = 0;

            // ดึง FFB Stats รวมของคาบเวลา (Period)
            $periodFFBStats = DB::connection('sqlsrv3')
                ->table('productions')
                ->whereDate('Date', '>=', $startDate->format('Y-m-d'))
                ->whereDate('Date', '<=', $endDate->format('Y-m-d'))
                ->select(
                    DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                    DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty')
                )->first();

            $periodGoodQty = (float)($periodFFBStats->good_qty ?? 0);
            $periodTotalFFB = (float)($periodFFBStats->total_ffb ?? 0);

            if ($periodGoodQty > 0) {
                // สูตร Yield Monthly (Market Yield): ((ยอดขาย - สต็อกก่อนหน้า) + สต็อกล่าสุด) / ปริมาณการผลิต
                $producedCpoPeriod = ($periodCpoSales - $openingStock) + $closingStock;
                $yieldPeriod = ($producedCpoPeriod / $periodGoodQty) * 100;
                
                // สูตร Yield+Oil Room: ((ยอดขาย - สต็อกก่อนหน้า) + สต็อกล่าสุด + Oil Room ล่าสุด) / ปริมาณการผลิต
                $producedWithOilPeriod = ($periodCpoSales - $openingStock) + $closingStock + $latestOilRoom;
                $yieldWithOilRoom = ($producedWithOilPeriod / $periodGoodQty) * 100;

                // สำหรับ yield_period_no_oil_room ให้ใช้ยอดผลิตสะสมจากตาราง cpo_data (แบบเดิม) เพื่อใช้ในคำนวณต้นทุน
                $yieldPeriodNoOilRoom = ($periodProductCPONoOilRoom / $periodGoodQty) * 100;
            }

            // 3. Current Yield (รายวันล่าสุด) - ใช้ยอดจากตาราง cpo_data โดยตรงตามสูตรเดิม
            $currentDailyYield = round((float)($cpoData->yield_cpo ?? 19.12), 2);
            $currentDailyYieldWithOil = round((float)($cpoData->yield_oil_room ?? 22.20), 2);
            $targetDate = $cpoData ? Carbon::parse(substr($cpoData->date, 0, 11))->format('Y-m-d') : $endDate->format('Y-m-d');

            return response()->json([
                'status' => 'success',
                'target_date' => $targetDate,
                'data' => [
                    'total_stock' => round((float)(($cpoData->total_cpo ?? 0)), 3),
                    'production_daily' => round((float)(($cpoData->product_cpo ?? 0)), 3),
                    'yield_percent' => round((float)$yieldPeriod, 2), // รายคาบตามสูตรใหม่ (ตามที่ขอ)
                    'yield_oil_room' => round((float)$yieldWithOilRoom, 2), // รายคาบตามสูตรใหม่ (รวม Oil Room)
                    'yield_period' => round((float)$yieldPeriod, 2), // รายคาบตามสูตรใหม่
                    'yield_period_oil_room' => round((float)$yieldWithOilRoom, 2), // รายคาบตามสูตรใหม่
                    'yield_period_no_oil_room' => round((float)$yieldPeriodNoOilRoom, 2),
                    'period_ffb_total' => round((float)$periodTotalFFB, 3),
                    'period_good_qty' => round((float)$periodGoodQty, 3),
                    'period_sales_cpo' => round((float)$periodCpoSales, 3),
                    'opening_stock' => round((float)$openingStock, 3),
                    'closing_stock' => round((float)$closingStock, 3),
                    'period_product_total' => round((float)$periodProductCPOWithOilRoom, 3),
                    'period_product_no_oil' => round((float)$periodProductCPONoOilRoom, 3),
                    'ffa' => round((float)(($cpoData->ffa_cpo ?? 0)), 2),
                    'dobi' => round((float)(($cpoData->dobi_cpo ?? 0)), 2),
                    'tanks' => [
                        'tank1' => round((float)(($cpoData->tank1_cpo_volume ?? 0)), 3),
                        'tank2' => round((float)(($cpoData->tank2_cpo_volume ?? 0)), 3),
                        'tank3' => round((float)(($cpoData->tank3_cpo_volume ?? 0)), 3),
                        'tank4' => round((float)(($cpoData->tank4_cpo_volume ?? 0)), 3),
                        'oil_room' => round((float)(($cpoData->cpo_oil_room ?? 0)), 3),
                    ],
                    'history' => $this->getCPOSparklineHistory($endDate, $allCpoData)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ดึงข้อมูลย้อนหลัง 7 วันเพื่อทำ Sparkline
     */
    private function getCPOSparklineHistory($endDate, $allCpoData)
    {
        $history = [];
        for ($i = 6; $i >= 0; $i--) {
            // โคลน Carbon object เพื่อไม่ให้กระทบค่าเดิม
            $targetDate = (clone $endDate)->subDays($i);
            $foundData = null;

            foreach ($allCpoData as $row) {
                // ทำความสะอาดวันที่: "Apr  5 2026 12:00:00:AM" -> "Apr  5 2026"
                $cleanDateStr = substr($row->date, 0, 11);
                try {
                    $rowDate = Carbon::parse($cleanDateStr);
                    if ($rowDate->lte($targetDate)) {
                        $foundData = $row;
                        break;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            $history[] = [
                'date' => $targetDate->format('Y-m-d'),
                'volume' => $foundData ? (float)$foundData->total_cpo : 0
            ];
        }
        return $history;
    }
}
