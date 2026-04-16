<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PRO\Production;
use App\Services\Production\PalmAnalyticsService;

class OrderForecastService
{
    protected $palmAnalytics;

    public function __construct(PalmAnalyticsService $palmAnalytics)
    {
        $this->palmAnalytics = $palmAnalytics;
    }

    public function getForecastData()
    {
        $todayStr = Carbon::today()->format('Y-m-d');
        
        // 1. Current Stocks
        // CPO Stock (from cpo_data)
        $latestCpo = DB::connection('sqlsrv')->table('cpo_data')
            ->orderBy('date', 'desc')
            ->first();
        $cpoStock = $latestCpo ? (float)$latestCpo->total_cpo : 0;

        // FFB Stock (from productions)
        $latestProduction = DB::connection('sqlsrv3')->table('productions')
            ->whereNull('deleted_at')
            ->orderBy('Date', 'desc')
            ->first();
        $ffbStock = $latestProduction ? (float)$latestProduction->FFBRemain : 0;

        // 2. Orders (from SOPlan)
        // We look for CPO (GoodID 2147) that are not cancelled
        $totalOrders = DB::connection('sqlsrv2')->table('SOPlan')
            ->where('GoodID', '2147')
            ->whereIn('Status', ['w', 'p'])
            ->whereNull('deleted_at')
            ->sum('AmntLoad') ?? 0;
        
        // Convert orders from KG to Tons (assuming AmntLoad is in KG if NetWei is KG)
        // Wait, looking at indexPlanOrder.tsx, AmntLoad is often translated as weight.
        // Let's assume it's KG and we want Tons.
        $totalOrdersTon = $totalOrders / 1000.0;

        // 3. Yield & Price Metrics
        // Average Yield (7-day)
        $availableDates = DB::connection('sqlsrv3')->table('productions')
            ->whereNull('deleted_at')
            ->whereDate('Date', '<=', $todayStr)
            ->orderBy('Date', 'desc')
            ->take(7)
            ->pluck('Date')
            ->toArray();

        if (!empty($availableDates)) {
            $sumFfb7d = DB::connection('sqlsrv3')->table('productions')
                ->whereIn('Date', $availableDates)
                ->sum('FFBGoodQty') ?? 0;
            $sumCpo7d = DB::connection('sqlsrv')->table('cpo_data')
                ->whereIn('date', $availableDates)
                ->sum('product_cpo') ?? 0;
            $yield7Days = $sumFfb7d > 0 ? ($sumCpo7d / $sumFfb7d) * 100 : 0;
        } else {
            $yield7Days = 0;
        }

        // Average FFB Price (Last 7 days average)
        $priceData = DB::connection('sqlsrv2')->table('Webapp_POInv')
            ->whereDate('DocuDate', '>=', Carbon::today()->subDays(7)->format('Y-m-d'))
            ->select(
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )->first();
        $avgFfbPrice = $priceData ? (float)$priceData->avg_price : 0;

        // 4. Forecasts (from PalmAnalyticsService)
        $analytics = $this->palmAnalytics->getIntakeAnalytics(30);
        $ffbForecast7Days = collect($analytics['forecast']['days_7'] ?? [])->sum('weight_ton') ?? 0;

        // 5. Calculations
        $expectedCpoFromStockFFB = ($ffbStock * $yield7Days) / 100.0;
        $expectedCpoFromForecastFFB = ($ffbForecast7Days * $yield7Days) / 100.0;
        $totalPotentialCpo = $cpoStock + $expectedCpoFromStockFFB + $expectedCpoFromForecastFFB;

        $netCpoGap = $totalOrdersTon - ($cpoStock + $expectedCpoFromStockFFB);
        $extraFfbNeeded = $netCpoGap > 0 ? ($netCpoGap / ($yield7Days / 100.0)) : 0;
        $budgetNeeded = $extraFfbNeeded * $avgFfbPrice * 1000.0; // Price is per KG, volume is Ton

        return [
            'metrics' => [
                'total_orders_ton' => round($totalOrdersTon, 2),
                'cpo_stock_ton' => round($cpoStock, 2),
                'ffb_stock_ton' => round($ffbStock, 2),
                'yield_percent' => round($yield7Days, 2),
                'avg_ffb_price' => round($avgFfbPrice, 2),
            ],
            'forecast' => [
                'ffb_intake_7d_ton' => round($ffbForecast7Days, 2),
                'expected_cpo_from_ffb_stock' => round($expectedCpoFromStockFFB, 2),
                'expected_cpo_from_forecast_intake' => round($expectedCpoFromForecastFFB, 2),
                'total_potential_cpo' => round($totalPotentialCpo, 2),
            ],
            'requirements' => [
                'ffb_needed_ton' => round($extraFfbNeeded, 2),
                'budget_needed_mb' => round($budgetNeeded / 1000000.0, 2), // Million Baht
                'net_cpo_gap_ton' => round($netCpoGap, 2),
            ],
            'chart' => [
                'daily' => $analytics['daily'],
                'forecast' => $analytics['forecast']['days_7']
            ],
            'last_updated' => now()->toDateTimeString()
        ];
    }
}
