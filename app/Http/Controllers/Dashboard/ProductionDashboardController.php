<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\ProductionMetricsService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ProductionDashboardController extends Controller
{
    public function __construct(
        private ProductionMetricsService $metricsService
    ) {}

    public function apiData(Request $request)
    {
        try {
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $kpi = $this->metricsService->getKPIData($date);
            $trend = $this->metricsService->getTrendData($date);
            $realtime = $this->metricsService->getRealtimeData($date);

            $productionOutput = floatval($kpi['basket']) * $kpi['avg_pickup'];
            $totalAvailable = $kpi['carry'] + $kpi['incoming'];
            $stock = $totalAvailable - $productionOutput;

            $targetProductionKg = ($realtime['elapsed_minutes'] / 60) * 45 * 1000;
            $plantOee = 0;
            if ($targetProductionKg > 0) {
                $plantOee = round(($productionOutput * 1000 / $targetProductionKg) * 100, 1);
            }

            return response()->json([
                'carry'              => $kpi['carry'],
                'incoming'           => $kpi['incoming'],
                'basket'             => $kpi['basket'],
                'avg_pickup'         => $kpi['avg_pickup'],
                
                'production_kg'      => round($productionOutput * 1000, 0),
                'total_palm_kg'      => round($totalAvailable * 1000, 0),
                'remaining_stock_kg' => round($stock * 1000, 0),
                'stock'              => round($stock, 2),
                
                'progress_palm'      => $totalAvailable > 0 ? round(($productionOutput / $totalAvailable) * 100, 1) : 0,
                'progress_stock'     => $totalAvailable > 0 ? round(($stock / $totalAvailable) * 100, 1) : 0,
                'progress_basket'    => min(round(($kpi['basket'] / 180) * 100, 1), 100),
                
                'start_time'         => $realtime['start_time'],
                'working_hours'      => $realtime['working_hours'],
                'plant_oee'          => $plantOee,
                'yield'              => round($trend['yield_7_days'] ?? 0, 2),
                
                'trend'              => [
                    'dates'      => $trend['dates'],
                    'palm_input' => $trend['palm_input'],
                    'production' => $trend['production'],
                    'yield'      => $trend['yield'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
