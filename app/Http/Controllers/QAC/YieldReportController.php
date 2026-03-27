<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\QAC\CPOData;
use App\Models\PRO\Production;
use Carbon\Carbon;

class YieldReportController extends Controller
{
    public function index()
    {
        return Inertia::render('QAC/YieldReport');
    }

    /**
     * API — คำนวณ %Yield ตามช่วงวันที่
     */
    public function apiData(Request $request)
    {
        try {
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');

            if (!$startDate || !$endDate) {
                $endDate = now()->format('Y-m-d');
                $startDate = now()->subDays(7)->format('Y-m-d');
            }

            // ===== 1. ข้อมูลวันล่าสุด =====
            $latestCpo = CPOData::orderBy('date', 'desc')->first();
            $latestDate = null;
            if ($latestCpo && $latestCpo->date) {
                $rawDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $latestCpo->date);
                $latestDate = Carbon::parse($rawDate)->format('Y-m-d');
            }

            $latestProductCpo = 0;
            $latestFfb = 0;
            $latestYield = 0;

            if ($latestDate) {
                $latestProductCpo = floatval($latestCpo->product_cpo ?? 0);

                $latestProd = Production::whereDate('Date', $latestDate)->first();
                $latestFfb = $latestProd ? floatval($latestProd->FFBGoodQty ?? 0) : 0;

                $latestYield = $latestFfb > 0 ? round(($latestProductCpo / $latestFfb) * 100, 2) : 0;
            }

            // ===== 2-5. ข้อมูลช่วงเวลา =====
            $cpoRecords = CPOData::whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate)
                ->get();

            $rangeProductCpo = $cpoRecords->sum(fn($r) => floatval($r->product_cpo ?? 0));
            $rangeCpoOilRoom = $cpoRecords->sum(fn($r) => floatval($r->cpo_oil_room ?? 0));
            $rangeSkim = round($cpoRecords->sum(fn($r) => floatval($r->skim ?? 0)), 3);
            $rangeMix = round($cpoRecords->sum(fn($r) => floatval($r->mix ?? 0)), 3);

            // FFBGoodQty ช่วงเวลา
            $rangeFfb = Production::whereDate('Date', '>=', $startDate)
                ->whereDate('Date', '<=', $endDate)
                ->sum('FFBGoodQty');
            $rangeFfb = floatval($rangeFfb);

            // %Yield ช่วงเวลา (product_cpo / FFBGoodQty)
            $rangeYield = $rangeFfb > 0 ? round(($rangeProductCpo / $rangeFfb) * 100, 2) : 0;

            // %Yield + Oil Room (product_cpo + cpo_oil_room) / FFBGoodQty
            $rangeYieldWithOilRoom = $rangeFfb > 0
                ? round((($rangeProductCpo + $rangeCpoOilRoom) / $rangeFfb) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                // Card 1: วันล่าสุด
                'latest_date' => $latestDate,
                'latest_product_cpo' => round($latestProductCpo, 3),
                'latest_ffb' => round($latestFfb, 3),
                'latest_yield' => $latestYield,
                // Card 2: %Yield ช่วงเวลา
                'range_product_cpo' => round($rangeProductCpo, 3),
                'range_ffb' => round($rangeFfb, 3),
                'range_yield' => $rangeYield,
                // Card 3: %Yield + Oil Room
                'range_cpo_oil_room' => round($rangeCpoOilRoom, 3),
                'range_yield_with_oil_room' => $rangeYieldWithOilRoom,
                // Card 4 & 5: Skim & Mix
                'range_skim' => $rangeSkim,
                'range_mix' => $rangeMix,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API — ข้อมูล %Yield รายวัน ตามเดือนที่เลือก
     */
    public function apiMonthlyYield(Request $request)
    {
        try {
            $month = $request->query('month'); // format YYYY-MM
            if (!$month) {
                $month = now()->format('Y-m');
            }

            $year = intval(substr($month, 0, 4));
            $mon = intval(substr($month, 5, 2));

            // ดึง cpo_data ทั้งเดือน
            $cpoRecords = CPOData::whereYear('date', $year)
                ->whereMonth('date', $mon)
                ->orderBy('date')
                ->get();

            $chartData = [];

            foreach ($cpoRecords as $record) {
                $rawDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $record->date);
                $dateStr = Carbon::parse($rawDate)->format('Y-m-d');
                $day = Carbon::parse($rawDate)->format('j'); // day number

                $productCpo = floatval($record->product_cpo ?? 0);
                $cpoOilRoom = floatval($record->cpo_oil_room ?? 0);

                // หา FFB ของวันนั้น
                $prod = Production::whereDate('Date', $dateStr)->first();
                $ffb = $prod ? floatval($prod->FFBGoodQty ?? 0) : 0;

                $yield = $ffb > 0 ? round(($productCpo / $ffb) * 100, 2) : 0;
                $yieldWithOilRoom = $ffb > 0 ? round((($productCpo + $cpoOilRoom) / $ffb) * 100, 2) : 0;

                $chartData[] = [
                    'date' => $dateStr,
                    'day' => $day,
                    'product_cpo' => round($productCpo, 3),
                    'cpo_oil_room' => round($cpoOilRoom, 3),
                    'ffb' => round($ffb, 3),
                    'yield' => $yield,
                    'yield_oil_room' => $yieldWithOilRoom,
                ];
            }

            return response()->json([
                'success' => true,
                'chart_data' => $chartData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
