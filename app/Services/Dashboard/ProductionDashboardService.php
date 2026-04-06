<?php

namespace App\Services\Dashboard;

use App\Models\PRO\Production;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProductionDashboardService
{
    /**
     * Get all dashboard data with fine-grained caching.
     * รองรับการรับ parameter $date เพื่อดึงย้อนหลัง
     */
    public function getDashboardData(?string $date = null): array
    {
        $targetDate = $date ?: Carbon::today()->format('Y-m-d');

        // 1. Realtime (cache 1 นาที) — basket count, timing
        $realtime = Cache::remember("dashboard.realtime.{$targetDate}", 60, function () use ($targetDate) {
            return $this->getRealtimeMetrics($targetDate);
        });

        // 2. KPI Metrics (cache 5 นาที) — carry over, incoming, etc.
        $kpi = Cache::remember("dashboard.kpi.{$targetDate}", 300, function () use ($targetDate) {
            return $this->getKpiMetrics($targetDate);
        });

        // 3. Trend Metrics (cache 5 นาที) — ข้อมูลกราฟ 7 วัน
        $trend = Cache::remember("dashboard.trend.{$targetDate}", 300, function () use ($targetDate) {
            return $this->getTrendMetrics($targetDate);
        });

        return $this->buildResponse($realtime, $kpi, $trend);
    }

    private function getRealtimeMetrics(string $date): array
    {
        $basketCount = DB::connection('sqlsrv3')
            ->table('Webapp_CountTrainHD')
            ->whereDate('created_at', $date)
            ->sum('CTAmnt');

        $latestHd = DB::connection('sqlsrv3')
            ->table('Webapp_CountTrainHD')
            ->whereDate('created_at', '<=', $date) // Adjust for logical past dates
            ->orderBy('created_at', 'desc')
            ->first();

        $startTimeStr = null;
        $earliestHdForDay = DB::connection('sqlsrv3')
            ->table('Webapp_CountTrainHD')
            ->whereDate('created_at', $date)
            ->orderBy('created_at', 'asc')
            ->first();

        if ($earliestHdForDay) {
            $firstDt = DB::connection('sqlsrv3')
                ->table('Webapp_CountTrainDT')
                ->where('CTID', $earliestHdForDay->CTID)
                ->orderBy('CTList', 'asc')
                ->first();
            $startTimeStr = $firstDt ? $firstDt->created_at : $earliestHdForDay->created_at;
        }

        $startTime = $startTimeStr ? Carbon::parse($startTimeStr)->format('H:i') : '-';
        if ($startTimeStr) {
            $start = Carbon::parse($startTimeStr, 'Asia/Bangkok');
            // If date is today, compare with now. If past date, compare with end of that day.
            $now = ($date === Carbon::today()->format('Y-m-d')) ? Carbon::now('Asia/Bangkok') : Carbon::parse($date)->endOfDay();
            $diff = $start->diff($now);
            $totalHours = ($diff->days * 24) + $diff->h;
            $workingHours = $totalHours . ':' . str_pad((string)$diff->i, 2, '0', STR_PAD_LEFT);
        } else {
            $workingHours = '0:00';
        }

        return [
            'basket_count' => $basketCount,
            'start_time'   => $startTime,
            'working_hours' => $workingHours,
        ];
    }

    private function getKpiMetrics(string $date): array
    {
        // 1. Carry Over
        $lastProdDay = Production::where('Date', '<', $date)
            ->orderBy('Date', 'desc')
            ->first();
        $carryOver = $lastProdDay ? floatval($lastProdDay->FFBRemain ?? 0) : 0;

        // 2. Incoming Palm (tons)
        $incoming = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->where('DocuDate', '=', $date)
            ->sum('GoodNet') / 1000;

        // 3. 7-Day Average Tons/Basket
        $sevenDaysAgo = Carbon::parse($date)->subDays(7)->format('Y-m-d');
        $recentProds = Production::whereDate('Date', '>', $sevenDaysAgo)
            ->whereDate('Date', '<=', $date)
            ->get();

        $sumFFB7d = $recentProds->sum('TotalFFB');
        $sumShifts7d = $recentProds->sum(fn($p) =>
            floatval($p->ShiftA ?? 0) + floatval($p->ShiftB ?? 0) + floatval($p->Shift3 ?? 0) +
            floatval($p->PickupRemain ?? 0) + floatval($p->RamRemain ?? 0)
        );
        $avgPickup7d = $sumShifts7d > 0 ? $sumFFB7d / $sumShifts7d : 0;

        return [
            'carry_over'    => $carryOver,
            'incoming'      => $incoming,
            'avg_pickup_7d' => $avgPickup7d,
        ];
    }

    private function getTrendMetrics(string $date): array
    {
        // 4. Last 7 available production dates from the target date backwards
        $availableDates = Production::whereDate('Date', '<=', $date)
            ->orderBy('Date', 'desc')
            ->take(7)
            ->pluck('Date')
            ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
            ->reverse()
            ->values()
            ->toArray();

        // If no dates available, return empty
        if (empty($availableDates)) {
            return [
                'dates'      => [],
                'palm_input' => [],
                'production' => [],
                'yield'      => [],
                'yield_7_days' => 0
            ];
        }

        // 5. KPI Yield (7 days)
        $sumFfb7d = Production::whereIn('Date', $availableDates)->sum('FFBGoodQty');
        $sumCpo7d = DB::table('cpo_data')->whereIn('date', $availableDates)->sum('product_cpo');
        $yield7Days = $sumFfb7d > 0 ? ($sumCpo7d / $sumFfb7d) * 100 : 0;

        // ===== BATCH TREND QUERIES =====
        $palmByDate = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->whereIn('DocuDate', $availableDates)
            ->groupBy('DocuDate')
            ->selectRaw('DocuDate, SUM(GoodNet) / 1000.0 as total')
            ->pluck('total', 'DocuDate');

        $prodByDate = Production::whereIn('Date', $availableDates)
            ->get()
            ->keyBy(fn($p) => Carbon::parse($p->Date)->format('Y-m-d'));

        $cpoByDate = DB::table('cpo_data')
            ->whereIn('date', $availableDates)
            ->get()
            ->keyBy('date');

        $trendDates = [];
        $palmInputTrend = [];
        $productionTrend = [];
        $yieldTrend = [];

        foreach ($availableDates as $d) {
            $trendDates[] = $d;

            $palmVal = floatval($palmByDate[$d] ?? 0);
            $palmInputTrend[] = round($palmVal, 2);

            $dayFfb = floatval($prodByDate[$d]->FFBGoodQty ?? 0);
            $productionTrend[] = round($dayFfb, 2);

            $dayCpo = floatval($cpoByDate[$d]->product_cpo ?? 0);
            $yieldTrend[] = $dayFfb > 0 ? round(($dayCpo / $dayFfb) * 100, 2) : 0;
        }

        return [
            'dates'        => $trendDates,
            'palm_input'   => $palmInputTrend,
            'production'   => $productionTrend,
            'yield'        => $yieldTrend,
            'yield_7_days' => $yield7Days,
        ];
    }

    private function buildResponse(array $realtime, array $kpi, array $trend): array
    {
        $basketCount = $realtime['basket_count'];
        $carryOver = $kpi['carry_over'];
        $incoming = $kpi['incoming'];
        $avgPickup7d = $kpi['avg_pickup_7d'];

        $productionOutput = floatval($basketCount) * $avgPickup7d;
        $totalAvailable = $carryOver + $incoming;
        $totalPalmKg = $totalAvailable * 1000;
        $stock = $carryOver + $incoming - $productionOutput;

        $progressPercent = $totalAvailable > 0 ? ($productionOutput / $totalAvailable) * 100 : 0;
        $basketProgress = min(($basketCount / 180) * 100, 100);
        $stockProgress = $totalAvailable > 0 ? ($stock / $totalAvailable) * 100 : 0;

        return [
            'carry'              => round($carryOver, 2),
            'incoming'           => round($incoming, 2),
            'total_palm_kg'      => round($totalPalmKg, 0),
            'remaining_stock_kg' => round($stock * 1000, 0),
            'progress_palm'      => round($progressPercent, 1),
            'progress_stock'     => round($stockProgress, 1),
            'progress_basket'    => round($basketProgress, 1),
            'basket'             => $basketCount,
            'start_time'         => $realtime['start_time'],
            'working_hours'      => $realtime['working_hours'],
            'production_kg'      => round($productionOutput * 1000, 0),
            'avg_pickup'         => round($avgPickup7d, 3),
            'stock'              => round($stock, 2),
            'yield'              => round($trend['yield_7_days'] ?? 0, 2),
            'trend'              => [
                'dates'      => $trend['dates'],
                'palm_input' => $trend['palm_input'],
                'production' => $trend['production'],
                'yield'      => $trend['yield'],
            ],
        ];
    }
}
