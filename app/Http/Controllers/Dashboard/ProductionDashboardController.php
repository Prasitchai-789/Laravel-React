<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PRO\Production;
use Carbon\Carbon;

class ProductionDashboardController extends Controller
{
    public function apiData()
    {
        try {
            $today = Carbon::today()->format('Y-m-d');
            
            // 1. Carry Over (tons) - FFBRemain from the previous production day
            $lastProdDay = Production::where('Date', '<', $today)
                ->orderBy('Date', 'desc')
                ->first();
            $carryOver = $lastProdDay ? floatval($lastProdDay->FFBRemain ?? 0) : 0;

            // 2. Incoming Palm (tons) - sqlsrv2.Webapp_POInv
            $incoming = DB::connection('sqlsrv2')
                ->table('Webapp_POInv')
                ->where('DocuDate', '=', $today)
                ->sum('GoodNet') / 1000;

            // 3. Basket Count - sqlsrv3.Webapp_CountTrainHD
            $basketCount = DB::connection('sqlsrv3')
                ->table('Webapp_CountTrainHD')
                ->whereDate('created_at', $today)
                ->sum('CTAmnt');

            // 4. Production Metrics (sqlsrv3.productions)
            $latestProd = Production::whereDate('Date', $today)->first();
            
            // 4.1. 7-Day Average Tons/Basket (Avg Pickup)
            $sevenDaysAgo = Carbon::today()->subDays(7)->format('Y-m-d');
            $recentProds = Production::whereDate('Date', '>', $sevenDaysAgo)
                ->whereDate('Date', '<=', $today)
                ->get();
            
            $sumFFB7d = $recentProds->sum('TotalFFB');
            $sumShifts7d = $recentProds->sum(fn($p) => 
                floatval($p->ShiftA ?? 0) + floatval($p->ShiftB ?? 0) + floatval($p->Shift3 ?? 0) + 
                floatval($p->PickupRemain ?? 0) + floatval($p->RamRemain ?? 0)
            );
            $avgPickup7d = $sumShifts7d > 0 ? $sumFFB7d / $sumShifts7d : 0;

            // Today's Processed Palm formula: Today's Basket Count * 7-Day Avg Tons/Basket
            $productionOutput = floatval($basketCount ?? 0) * $avgPickup7d;

            // 5. Remaining Stock
            $stockVal = $productionOutput;
            $stock = $carryOver + $incoming - $stockVal;

            // 6. Get the last 7 available production dates
            $recentProductionDates = Production::orderBy('Date', 'desc')
                ->take(7)
                ->pluck('Date')
                ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
                ->toArray();
            
            // Re-order to chronological for trends
            $availableDates = array_reverse($recentProductionDates);

            // 6.1. Calculate KPI Yield based on these 7 available dates
            $sumFfb7d = Production::whereIn('Date', $availableDates)->sum('FFBGoodQty');
            $sumCpo7d = DB::table('cpo_data')->whereIn('date', $availableDates)->sum('product_cpo');
            $yield7Days = $sumFfb7d > 0 ? ($sumCpo7d / $sumFfb7d) * 100 : 0;

            // 7. Trend Data (based on last 7 available dates)
            $trendDates = [];
            $palmInputTrend = [];
            $productionTrend = [];
            $yieldTrend = [];

            foreach ($availableDates as $date) {
                $trendDates[] = $date;

                // Palm Input (Incoming tons)
                $palmVal = DB::connection('sqlsrv2')
                    ->table('Webapp_POInv')
                    ->where('DocuDate', $date)
                    ->sum('GoodNet') / 1000;
                $palmInputTrend[] = round($palmVal, 2);

                // Production
                $prodDay = Production::whereDate('Date', $date)->first();
                $dayFfb = floatval($prodDay->FFBGoodQty ?? 0);
                $productionTrend[] = round($dayFfb, 2);

                // Daily Yield (product_cpo)
                $cpoDay = DB::table('cpo_data')->whereDate('date', $date)->first();
                $dayCpo = floatval($cpoDay->product_cpo ?? 0);
                $yieldTrend[] = $dayFfb > 0 ? round(($dayCpo / $dayFfb) * 100, 2) : 0;
            }


            $totalAvailable = $carryOver + $incoming;
            $totalPalmKg = $totalAvailable * 1000;
            $progressPercent = $totalAvailable > 0 ? ($productionOutput / $totalAvailable) * 100 : 0;
            
            // Timing for Baskets (Refined)
            $hd = DB::connection('sqlsrv3')
                ->table('Webapp_CountTrainHD')
                ->whereDate('CTDateStart', $today)
                ->orderBy('created_at', 'asc')
                ->first();

            // 7. Timing for Baskets (Shift-Aware)
            // Identify the latest CTDateStart in the system to determine the active production day
            $latestHd = DB::connection('sqlsrv3')
                ->table('Webapp_CountTrainHD')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($latestHd && $latestHd->CTDateStart) {
                // Find the VERY FIRST shift header for this specific production day
                $earliestHdForDay = DB::connection('sqlsrv3')
                    ->table('Webapp_CountTrainHD')
                    ->whereDate('CTDateStart', Carbon::parse($latestHd->CTDateStart)->format('Y-m-d'))
                    ->orderBy('created_at', 'asc')
                    ->first();

                if ($earliestHdForDay) {
                    $firstDt = DB::connection('sqlsrv3')
                        ->table('Webapp_CountTrainDT')
                        ->where('CTID', $earliestHdForDay->CTID)
                        ->orderBy('CTList', 'asc')
                        ->first();
                    
                    $startTimeStr = $firstDt ? $firstDt->created_at : $earliestHdForDay->created_at;
                } else {
                    $startTimeStr = null;
                }
            } else {
                $startTimeStr = null;
            }

            $startTime = $startTimeStr ? Carbon::parse($startTimeStr)->format('H:i') : '-';
            
            // Continuous Working Hours: From first shift start to NOW (Thai Timezone)
            if ($startTimeStr) {
                // Force ICT (Asia/Bangkok) to match DB and local time
                $start = Carbon::parse($startTimeStr, 'Asia/Bangkok');
                $now = Carbon::now('Asia/Bangkok');
                
                $diff = $start->diff($now);
                $totalHours = ($diff->days * 24) + $diff->h;
                $workingHours = $totalHours . ':' . str_pad($diff->i, 2, '0', STR_PAD_LEFT);
            } else {
                $workingHours = '0:00';
            }

            // Additional Progress Metrics
            $basketProgress = min(($basketCount / 180) * 100, 100); // Assume target 180 baskets
            $stockProgress = $totalAvailable > 0 ? ($stock / $totalAvailable) * 100 : 0;

            // 8. Yield and Trend Results (Already calculated above)
            return response()->json([
                'carry' => round($carryOver, 2),
                'incoming' => round($incoming, 2),
                'total_palm_kg' => round($totalPalmKg, 0),
                'remaining_stock_kg' => round($stock * 1000, 0),
                'progress_palm' => round($progressPercent, 1),
                'progress_stock' => round($stockProgress, 1),
                'progress_basket' => round($basketProgress, 1),
                'basket' => $basketCount,
                'start_time' => $startTime,
                'working_hours' => $workingHours,
                'production_kg' => round($productionOutput * 1000, 0),
                'avg_pickup' => round($avgPickup7d, 3),
                'stock' => round($stock, 2),
                'yield' => round($yield7Days, 2),
                'trend' => [
                    'dates' => $trendDates,
                    'palm_input' => $palmInputTrend,
                    'production' => $productionTrend,
                    'yield' => $yieldTrend
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
