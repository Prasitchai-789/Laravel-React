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

            if (!$endDate) {
                $endDate = now()->subDay()->format('Y-m-d');
            }

            if (!$startDate) {
                $startDate = $this->getLatestPurgeSystemStartDate($endDate)
                    ?? Carbon::parse($endDate)->subDays(7)->format('Y-m-d');
            }

            // ===== 1. ข้อมูลวันล่าสุด =====
            $latestCpo = CPOData::whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate)
                ->orderBy('date', 'desc')
                ->first();
            $latestDate = null;
            if ($latestCpo && $latestCpo->date) {
                $rawDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $latestCpo->date);
                $latestDate = Carbon::parse($rawDate)->format('Y-m-d');
            }

            $latestProductCpo = 0;
            $latestCpoOilRoom = 0;
            $latestFfb = 0;
            $latestYield = 0;

            if ($latestDate) {
                $latestProductCpo = floatval($latestCpo->product_cpo ?? 0);
                $latestCpoOilRoom = floatval($latestCpo->cpo_oil_room ?? 0);

                $latestProd = Production::whereDate('Date', $latestDate)->first();
                $latestFfb = $latestProd ? floatval($latestProd->FFBGoodQty ?? 0) : 0;

                $latestYield = $latestFfb > 0 ? round((($latestProductCpo + $latestCpoOilRoom) / $latestFfb) * 100, 2) : 0;
            }

            // ===== 2-5. ข้อมูลช่วงเวลา =====
            $cpoRecords = CPOData::whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate)
                ->get();

            $rangeProductCpo = $cpoRecords->sum(fn($r) => floatval($r->product_cpo ?? 0));
            // CPO Oil Room uses data from the latest date in the selected range
            $latestRecordInRange = $cpoRecords->sortByDesc('date')->first();
            $rangeCpoOilRoom = $latestRecordInRange ? floatval($latestRecordInRange->cpo_oil_room ?? 0) : 0;
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
                'start_date' => $startDate,
                'end_date' => $endDate,
                // Card 1: วันล่าสุด
                'latest_date' => $latestDate,
                'latest_product_cpo' => round($latestProductCpo, 3),
                'latest_cpo_oil_room' => round($latestCpoOilRoom, 3),
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

    private function getLatestPurgeSystemStartDate(string $endDate): ?string
    {
        $latestPurge = CPOData::where('purge_system_status', 1)
            ->whereDate('date', '<=', $endDate)
            ->orderBy('date', 'desc')
            ->first();

        if (!$latestPurge || !$latestPurge->date) {
            return null;
        }

        $rawDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $latestPurge->date);

        return Carbon::parse($rawDate)->format('Y-m-d');
    }

    /**
     * API — ข้อมูล %Yield รายวัน ตามเดือนที่เลือก (ครบทุกวันในเดือน)
     */
    public function apiMonthlyYield(Request $request)
    {
        try {
            $month = $request->query('month'); // format YYYY-MM
            if (!$month) {
                $month = now()->format('Y-m');
            }

            $year = intval(substr($month, 0, 4));
            $mon  = intval(substr($month, 5, 2));

            // สร้างลิสต์วันทุกวันของเดือน
            $startOfMonth = Carbon::createFromDate($year, $mon, 1)->startOfDay();
            $endOfMonth   = $startOfMonth->copy()->endOfMonth();

            // ดึง cpo_data ทั้งเดือน แล้ว index ด้วย วัน YYYY-MM-DD
            $cpoRecords = CPOData::whereYear('date', $year)
                ->whereMonth('date', $mon)
                ->orderBy('date')
                ->get()
                ->keyBy(function ($r) {
                    $raw = str_replace([':AM', ':PM'], [' AM', ' PM'], $r->date);
                    return Carbon::parse($raw)->format('Y-m-d');
                });

            // ดึง Production เฉพาะเดือนนั้น แล้ว index ด้วย วัน YYYY-MM-DD
            $productions = Production::whereDate('Date', '>=', $startOfMonth->format('Y-m-d'))
                ->whereDate('Date', '<=', $endOfMonth->format('Y-m-d'))
                ->get()
                ->keyBy(fn($p) => Carbon::parse($p->Date)->format('Y-m-d'));

            $chartData = [];
            $current = $startOfMonth->copy();

            while ($current->lte($endOfMonth)) {
                $dateStr = $current->format('Y-m-d');
                $day     = $current->day; // 1..31

                $record     = $cpoRecords->get($dateStr);
                $prod       = $productions->get($dateStr);

                $productCpo   = $record ? floatval($record->product_cpo  ?? 0) : 0;
                $cpoOilRoom   = $record ? floatval($record->cpo_oil_room ?? 0) : 0;
                $ffb          = $prod   ? floatval($prod->FFBGoodQty     ?? 0) : 0;

                $yield            = $ffb > 0 ? round(($productCpo / $ffb) * 100, 2) : 0;
                $yieldWithOilRoom = $ffb > 0 ? round((($productCpo + $cpoOilRoom) / $ffb) * 100, 2) : 0;

                $chartData[] = [
                    'date'          => $dateStr,
                    'day'           => $day,
                    'product_cpo'   => round($productCpo, 3),
                    'cpo_oil_room'  => round($cpoOilRoom, 3),
                    'ffb'           => round($ffb, 3),
                    'yield'         => $yield,
                    'yield_oil_room' => $yieldWithOilRoom,
                ];

                $current->addDay();
            }

            return response()->json([
                'success'    => true,
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
