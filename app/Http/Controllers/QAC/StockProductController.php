<?php

namespace App\Http\Controllers\QAC;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class StockProductController extends Controller
{
    public function apiProduction(Request $request)
    {
        $date = $request->query('date');
        $date = $this->normalizeDate($date);

        if (!$date) {
            return response()->json([
                'success' => false,
                'message' => 'Missing or invalid date'
            ]);
        }

        // -------------------
        // 1) Stock CPO วันที่เลือก
        // -------------------
        $current = DB::table('cpo_data')
            ->whereDate('date', $date)
            ->first();

        if (!$current) {
            return response()->json([
                'success' => false,
                'message' => "No stock data for date {$date}"
            ]);
        }

        $currentCPO = (float) $current->total_cpo;
        $ffa_cpo = (float) $current->ffa_cpo;
        $dobi_cpo = (float) $current->dobi_cpo;

        // -------------------
        // 2) Stock CPO วันก่อนหน้า
        // -------------------
        $previous = DB::table('cpo_data')
            ->whereDate('date', '<', $date)
            ->orderBy('date', 'desc')
            ->first();

        $previousCPO = $previous ? (float) $previous->total_cpo : 0;

        // -------------------
        // 3) ยอดขาย GoodID 2147
        // -------------------
        $salesCPO = DB::connection('sqlsrv2')
            ->table('SOPlan')
            ->selectRaw('SUM(NetWei) AS total_netwei')
            ->whereDate('SOPDate', $date)
            ->where('GoodID', 2147)
            ->first();

        $salesCPOTons = $salesCPO ? ((float) $salesCPO->total_netwei / 1000) : 0;


        // 1) Stock silo วันที่เลือก
        // -------------------
        $currentSilo = DB::table('silo_records')
            ->whereDate('record_date', $date)
            ->first();

        if (!$currentSilo) {
            return response()->json([
                'success' => false,
                'message' => "No stock silo data for date {$date}"
            ]);
        }

        $moisture_percent = (float) $currentSilo->moisture_percent;
        $dirt_percent = (float) $currentSilo->shell_percent;
        // -------------------
        // 1) Stock KN วันที่เลือก
        // -------------------
        $currentProducts = DB::table('stock_products')
            ->whereDate('record_date', $date)
            ->first();

        if (!$currentProducts) {
            return response()->json([
                'success' => false,
                'message' => "No stock data for date {$date}"
            ]);
        }

        $currentKN = (float) $currentProducts->pkn;
        $currentKNOut = (float) $currentProducts->pkn_out;
        $currentEFBFiber = (float) $currentProducts->efb_fiber;
        $currentShell = (float) $currentProducts->shell;
        $currentEFB = (float) $currentProducts->efb;
        $currentNUT = (float) $currentProducts->nut;
        $currentNUTOut = (float) $currentProducts->nut_out;
        $currentSilo1 = (float) $currentProducts->silo_1;
        $currentSilo2 = (float) $currentProducts->silo_2;

        // -------------------
        // 2) Stock KN วันก่อนหน้า
        // -------------------
        $previousKN = DB::table('stock_products')
            ->whereDate('record_date', '<', $date)
            ->orderBy('record_date', 'desc')
            ->first();

        $previousKN = $previousKN ? (float) $previousKN->pkn : 0;
        // -------------------
        // 3) ยอดขาย GoodID 2152
        // -------------------
        $salesKN = DB::connection('sqlsrv2')
            ->table('SOPlan')
            ->selectRaw('SUM(NetWei) AS total_netwei')
            ->whereDate('SOPDate', $date)
            ->where('GoodID', 2152)
            ->first();

        $salesKNTons = $salesKN ? ((float) $salesKN->total_netwei / 1000) : 0;

        // -------------------
        // 4) ปาล์มเข้าผลิต
        // -------------------
        $prod = DB::connection('sqlsrv3')
            ->table('productions')
            ->whereDate('Date', $date)
            ->first();

        $ffbGoodQty = $prod ? (float) $prod->FFBGoodQty : 0;
        $ffbPurchase = $prod ? (float) $prod->FFBPurchase : 0;
        $ffbForward = $prod ? (float) $prod->FFBForward : 0;
        $ffbRemain = $prod ? (float) $prod->FFBRemain : 0;

        $ffbGoodQtyOfMonth = $this->getMonthlyFFBSum($date);
        $ffbPurchaseOfMonth = $this->getMonthlyFFBPurchaseSum($date);

        $skim =  $current->skim ?? 0;
        // -------------------
        // 5) สูตร Yield
        // -------------------
        $yield = 0;
        if ($ffbGoodQty > 0) {
            $numerator = $currentCPO - ($previousCPO - $salesCPOTons);
            $yield = (($numerator - $skim) / $ffbGoodQty) * 100;
        }

        $result = $this->calculateProductionSummary([
            'currentCPO'    => $currentCPO,
            'previousCPO'   =>  $previousCPO,
            'salesCPOTons'  => $salesCPOTons,
            'skim'          => $skim,
            'ffbGoodQty'    => $ffbGoodQty,

            'currentKN'     => $currentKN,
            'previousKN'    => $previousKN,
            'salesKNTons'   => $salesKNTons,
        ]);

        $cpo_data_tank = $this->getCpoData($date);

        $ffbTrend7Days = $this->getFFBTrend7Days($date);

        return response()->json([
            'success' => true,
            'date' => $date,
            'total_cpo' => round($currentCPO, 3),
            'ffa_cpo' => round($ffa_cpo, 3),
            'dobi_cpo' => round($dobi_cpo, 3),
            'previous_total_cpo' => round($previousCPO, 3),
            'sales_cpo_tons' => round($salesCPOTons, 3),
            'ffb_good_qty' => round($ffbGoodQty, 3),
            'yield_percent' => round($yield, 3),
            'skim' => round($skim, 3),
            'ffb_good_qty_month' => round($ffbGoodQtyOfMonth, 3),
            'ffb_purchase_month' => round($ffbPurchaseOfMonth, 3),
            'ffb_forward' => round($ffbForward, 3),
            'ffb_remain' => round($ffbRemain, 3),
            'ffb_purchase' => round($ffbPurchase, 3),

            'total_kn' => round($currentKN, 3),
            'moisture_percent' => round($moisture_percent, 3),
            'dirt_percent' => round($dirt_percent, 3),
            'previous_total_kn' => round($previousKN, 3),
            'sales_kn_tons' => round($salesKNTons, 3),

            'kn_out' => round($currentKNOut, 3),
            'efb_fiber' => round($currentEFBFiber, 3),
            'shell' => round($currentShell, 3),
            'efb' => round($currentEFB, 3),
            'nut' => round($currentNUT, 3),
            'nut_out' => round($currentNUTOut, 3),
            'silo_1' => round($currentSilo1, 3),
            'silo_2' => round($currentSilo2, 3),
            'result' => $result,
            'cpo_data_tank' => $cpo_data_tank,

            'ffb_trend_7days' => $ffbTrend7Days,

        ]);
    }

    private function normalizeDate($dateInput)
    {
        if ($dateInput === 'latest') {
            return $this->getLatestAvailableDate();
        }

        if (!$dateInput) {
            return $this->getLatestAvailableDate();
        }

        try {
            // ⭐ แก้ไขตรงนี้: ลบส่วนเวลาและคำว่า AM/PM ออก
            $cleanDate = preg_replace('/\s*12:00:00:AM\s*/i', '', $dateInput);
            $cleanDate = preg_replace('/\s*00:00:00\s*/i', '', $cleanDate);
            $cleanDate = trim($cleanDate);

            // Debug: ดูค่าวันที่ก่อนและหลังทำความสะอาด
            \Log::info('Date normalization:', [
                'input' => $dateInput,
                'clean' => $cleanDate
            ]);

            // ลองแปลงด้วย Carbon
            $date = Carbon::parse($cleanDate);

            if ($date->isValid()) {
                return $date->format('Y-m-d');
            }
        } catch (\Exception $e) {
            \Log::warning('Date parsing failed:', [
                'input' => $dateInput,
                'error' => $e->getMessage()
            ]);
        }

        // Fallback: ใช้วันที่ล่าสุดจาก database
        return $this->getLatestAvailableDate();
    }

    /**
     * หาวันที่ล่าสุดที่มีข้อมูลใน database
     */
    private function getLatestAvailableDate()
    {
        // ลองหาจากตาราง cpo_data ก่อน
        $latestDate = DB::table('cpo_data')
            ->select(DB::raw('MAX(date) as latest_date'))
            ->value('latest_date');

        if ($latestDate) {
            try {
                return Carbon::parse($latestDate)->format('Y-m-d');
            } catch (\Exception $e) {
                \Log::warning('Failed to parse latest date from cpo_data:', [
                    'date' => $latestDate,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // ลองหาจากตารางอื่นๆ เป็น fallback
        $latestDate = DB::table('stock_products')
            ->select(DB::raw('MAX(record_date) as latest_date'))
            ->value('latest_date');

        if ($latestDate) {
            try {
                return Carbon::parse($latestDate)->format('Y-m-d');
            } catch (\Exception $e) {
                // ถ้ายัง error ให้ใช้วันปัจจุบัน
            }
        }

        // ถ้าไม่มีข้อมูลเลย ให้ใช้วันปัจจุบัน
        return Carbon::today()->format('Y-m-d');
    }


    public function getMonthlyFFBSum($date)
    {
        // แปลงวันที่เป็น Carbon เพื่อใช้คำนวณ
        $current = \Carbon\Carbon::parse($date);

        // วันที่ 1 ของเดือนเดียวกับ $date
        $startDate = $current->copy()->startOfMonth()->toDateString();

        // วันที่สิ้นสุด คือ $date เอง
        $endDate = $current->copy()->toDateString();

        // ดึงผลรวม FFBGoodQty
        $sum = DB::connection('sqlsrv3')
            ->table('productions')
            ->whereBetween('Date', [$startDate, $endDate])
            ->sum('FFBGoodQty');

        return $sum;
    }

    public function getMonthlyFFBPurchaseSum($date)
    {
        // แปลงวันที่เป็น Carbon เพื่อใช้คำนวณ
        $current = \Carbon\Carbon::parse($date);

        // วันที่ 1 ของเดือนเดียวกับ $date
        $startDate = $current->copy()->startOfMonth()->toDateString();

        // วันที่สิ้นสุด คือ $date เอง
        $endDate = $current->copy()->toDateString();

        // ดึงผลรวม FFBGoodQty
        $sum = DB::connection('sqlsrv3')
            ->table('productions')
            ->whereBetween('Date', [$startDate, $endDate])
            ->sum('FFBPurchase');

        return $sum;
    }

    public function calculateCPOYield($currentCPO, $previousCPO, $salesCPOTons, $skim, $ffbGoodQty)
    {
        if ($ffbGoodQty <= 0) {
            return 0;
        }

        // ผลผลิต CPO จริงที่เกิดจากการผลิตวันนี้
        $numerator = $currentCPO - ($previousCPO - $salesCPOTons) - $skim;

        return round(($numerator / $ffbGoodQty) * 100, 2);
    }

    public function calculateKNYield($currentKN, $previousKN, $salesKNTons, $ffbGoodQty)
    {
        if ($ffbGoodQty <= 0) {
            return 0;
        }

        $kernelToday = $currentKN - ($previousKN - $salesKNTons);

        return round(($kernelToday / $ffbGoodQty) * 100, 2);
    }

    public function calculateProductionSummary($data)
    {
        $currentCPO     = $data['currentCPO'];
        $previousCPO    = $data['previousCPO'];
        $salesCPOTons   = $data['salesCPOTons'];
        $skim           = $data['skim'];
        $ffbGoodQty     = $data['ffbGoodQty'];

        $currentKN      = $data['currentKN'];
        $previousKN     = $data['previousKN'];
        $salesKNTons    = $data['salesKNTons'];

        // CPO Yield
        $cpoYield = $this->calculateCPOYield(
            $currentCPO,
            $previousCPO,
            $salesCPOTons,
            $skim,
            $ffbGoodQty
        );

        // KN Yield
        $knYield = $this->calculateKNYield(
            $currentKN,
            $previousKN,
            $salesKNTons,
            $ffbGoodQty
        );

        return [
            'cpo_yield' => $cpoYield,
            'kn_yield'  => $knYield,
            'kernel_today' => round(($currentKN - ($previousKN - $salesKNTons)), 3),
            'cpo_today'    => round(($currentCPO - ($previousCPO - $salesCPOTons) - $skim), 3),
        ];
    }

    public function getCpoData($date)
    {
        $current = DB::table('cpo_data')
            ->whereDate('date', $date)
            ->first();

        if (!$current) {
            return response()->json([
                'success' => false,
                'message' => "No stock data for date {$date}"
            ]);
        }

        return [
            't1' => [
                'volume' => (float) $current->tank1_cpo_volume,
                'ffa'    => (float) $current->tank1_ffa,
                'dobi'   => (float) $current->tank1_dobi,
            ],

            't2' => [
                'volume' => (float) $current->tank2_cpo_volume,
                'ffa'    => (float) $current->tank2_top_ffa,  // เลือก top
                'dobi'   => (float) $current->tank2_top_dobi,
            ],

            't3' => [
                'volume' => (float) $current->tank3_cpo_volume,
                'ffa'    => (float) $current->tank3_top_ffa,
                'dobi'   => (float) $current->tank3_top_dobi,
            ],

            't4' => [
                'volume' => (float) $current->tank4_cpo_volume,
                'ffa'    => (float) $current->tank4_top_ffa,
                'dobi'   => (float) $current->tank4_top_dobi,
            ],

            'summary' => [
                'total_cpo' => (float) $current->total_cpo,
                'ffa_cpo'   => (float) $current->ffa_cpo,
                'dobi_cpo'  => (float) $current->dobi_cpo,
            ],
        ];
    }

    private function getFFBTrend7Days($date)
    {
        $end = Carbon::parse($date)->endOfDay();
        $start = Carbon::parse($date)->subDays(6)->startOfDay(); // 7 วันย้อนหลัง

        $rows = DB::connection('sqlsrv3')
            ->table('productions')
            ->selectRaw("
            CONVERT(date, [Date]) AS production_date,
            SUM(FFBPurchase) AS ffb_purchase,
            SUM(FFBGoodQty) AS ffb_good_qty
        ")
            ->whereBetween('Date', [$start, $end])
            ->groupBy(DB::raw('CONVERT(date, [Date])'))
            ->orderBy('production_date')
            ->get();

        // แปลงให้อยู่ในรูปแบบง่าย ๆ
        return $rows->map(function ($row) {
            return [
                'date'          => $row->production_date,        // '2025-11-11'
                'ffb_purchase'  => (float) $row->ffb_purchase,   // รับเข้า
                'ffb_good_qty'  => (float) $row->ffb_good_qty,   // เบิกผลิต
            ];
        })->values()->all();
    }
}
