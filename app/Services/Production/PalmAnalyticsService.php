<?php

namespace App\Services\Production;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PalmAnalyticsService
{
    /**
     * Get Daily FFB Intake Trends and KPIs
     */
    public function getIntakeAnalytics($days = 30)
    {
        return $this->getAnalyticsCached($days);
    }

    /**
     * Get analytics with Redis Caching (1-hour TTL)
     */
    public function getAnalyticsCached($days = 30)
    {
        $cacheKey = "palm_analytics_v1_d{$days}";
        
        return Cache::remember($cacheKey, now()->addHour(), function() use ($days) {
            return $this->getAnalyticsSync($days);
        });
    }

    /**
     * Core logic (Heavy Computation)
     */
    public function getAnalyticsSync($days = 30)
    {
        $startDate = Carbon::today()->subDays($days)->format('Y-m-d');
        
        // 1. Daily Aggregation (Weight & Price)
        $dailyData = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->select(
                'DocuDate as date',
                DB::raw('SUM(GoodNet) / 1000.0 as weight_ton'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )
            ->where('DocuDate', '>=', $startDate)
            ->groupBy('DocuDate')
            ->orderBy('DocuDate', 'asc')
            ->get();

        // 2. Add Seasonal Baseline (Historical Median from 2022-2025)
        $seasonalAverages = $this->getHistoricalDailyAverages();
        $dailyData = $dailyData->map(function($item) use ($seasonalAverages) {
            $key = Carbon::parse($item->date)->format('m-d');
            $item->moving_avg = round($seasonalAverages[$key] ?? 0, 2);
            return $item;
        });

        // 3. Correlation Analysis (Volume vs Price)
        $correlation = $this->calculateCorrelation($dailyData->pluck('weight_ton'), $dailyData->pluck('avg_price'));

        // 4. Forecasts
        $seasonalAverages = $this->getHistoricalDailyAverages();
        $forecast7  = $this->generateForecast($dailyData, 7, $seasonalAverages);
        $forecast30 = $this->generateForecast($dailyData, 30, $seasonalAverages);
        $forecast90 = $this->generateForecast($dailyData, 90, $seasonalAverages);

        // 5. Financial Impact Analysis (Projected Revenue)
        $financials = $this->calculateFinancialImpact($forecast30, $dailyData->avg('avg_price'));

        // 6. Anomaly Detection (Enhanced 25% Threshold)
        $anomalies = $this->detectAnomalies($dailyData, $seasonalAverages);

        return [
            'daily' => $dailyData,
            'kpis' => [
                'total_weight' => $dailyData->sum('weight_ton'),
                'avg_price' => $dailyData->avg('avg_price'),
                'price_momentum' => $this->calculatePriceMomentum($dailyData),
                'total_revenue' => $financials['actual_total_revenue'],
                'forecast_revenue' => $financials['forecast_total_revenue'],
                'correlation' => round($correlation, 2),
                'anomaly_count' => count($anomalies),
            ],
            'forecast' => [
                'days_7'  => $forecast7,
                'days_30' => $forecast30,
                'days_90' => $forecast90,
            ],
            'anomalies' => $anomalies,
            'financials' => $financials,
            'generated_at' => now()->toDateTimeString()
        ];
    }

    /**
     * Persist current analytics to App DB (Daily Persistence)
     */
    public function persistAnalytics()
    {
        Log::info("PalmAnalytics: Starting persistence job...");
        
        $data = $this->getAnalyticsSync(30);

        DB::transaction(function() use ($data) {
            // 1. Persist Forecasts (Next 30 days)
            foreach ($data['forecast']['days_30'] as $f) {
                DB::table('palm_forecasts')->updateOrInsert(
                    ['forecast_date' => $f['date']],
                    [
                        'volume_forecast' => $f['weight_ton'],
                        'volume_lower_bound' => $f['lower_bound'],
                        'volume_upper_bound' => $f['upper_bound'],
                        'revenue_projection' => $f['weight_ton'] * ($data['kpis']['avg_price'] ?: 0),
                        'updated_at' => now()
                    ]
                );
            }

            // 2. Persist Anomalies
            foreach ($data['anomalies'] as $a) {
                DB::table('palm_anomalies')->updateOrInsert(
                    ['occurrence_date' => $a['date']],
                    [
                        'actual_volume' => $a['actual'],
                        'expected_volume' => $a['expected'],
                        'deviation_percent' => $a['deviation_pct'],
                        'status' => $a['severity'],
                        'type' => $a['status'],
                        'updated_at' => now()
                    ]
                );
            }
        });

        // 3. Refresh Cache
        Cache::put("palm_analytics_v1_d30", $data, now()->addHours(24));
        Log::info("PalmAnalytics: Persistence completed successfully.");
        
        return $data;
    }

    /**
     * Forecast using Historical Seasonal Ratio (Actual vs History same-period)
     */
    private function generateForecast($data, $futureDays, $seasonalAverages)
    {
        if (count($data) < 7) return [];

        // 1. Calculate Weighted Performance Ratio (Momentum) from last 14 days
        $performanceRatio = $this->calculatePerformanceRatio($seasonalAverages);

        $lastDate = Carbon::parse($data->last()->date);
        
        $forecast = [];
        for ($i = 1; $i <= $futureDays; $i++) {
            $targetDate = $lastDate->copy()->addDays($i);
            $dayMonthKey = $targetDate->format('m-d');
            
            // Base value is the robust historical median for this day
            // If historical data is missing (e.g. Songkran holiday closures), we default to 0
            // rather than falling back to recent high-season averages which causes spikes.
            $baseVal = $seasonalAverages[$dayMonthKey] ?? 0;
            
            // Forecast = History * Weighted Ratio (preserving the "Shape" of history)
            $finalVal = $baseVal * $performanceRatio;
            
            // Confidence Bands (Standard 15% Variance for agricultural supply)
            $lowerBound = $finalVal * 0.85;
            $upperBound = $finalVal * 1.15;

            $forecast[] = [
                'date' => $targetDate->format('Y-m-d'),
                'weight_ton' => max(0, round($finalVal, 2)),
                'lower_bound' => max(0, round($lowerBound, 2)),
                'upper_bound' => max(0, round($upperBound, 2)),
                'is_forecast' => true,
                'performance_multiplier' => round($performanceRatio, 2)
            ];
        }

        return $forecast;
    }

    /**
     * Compare recent performance to historical median (70% weight on last 7 days)
     */
    private function calculatePerformanceRatio($historicalAverages)
    {
        $today = Carbon::now();
        $recentDays = 14;
        
        $actuals = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->select(
                DB::raw('MONTH(DocuDate) as month'),
                DB::raw('DAY(DocuDate) as day'),
                DB::raw('SUM(GoodNet) / 1000.0 as weight_ton'),
                'DocuDate'
            )
            ->where('DocuDate', '>=', $today->copy()->subDays($recentDays)->format('Y-m-d'))
            ->where('DocuDate', '<', $today->format('Y-m-d'))
            ->groupBy('DocuDate', DB::raw('MONTH(DocuDate)'), DB::raw('DAY(DocuDate)'))
            ->orderBy('DocuDate', 'DESC')
            ->get();

        if ($actuals->isEmpty()) return 1.0;

        $ratiosRecent = []; // Last 7 days (70% weight)
        $ratiosPrior = [];  // Days 8-14 (30% weight)
        
        foreach ($actuals as $actual) {
            $key = sprintf('%02d-%02d', $actual->month, $actual->day);
            $expected = $historicalAverages[$key] ?? 0;
            
            if ($expected > 0) {
                $ratio = $actual->weight_ton / $expected;
                $diffDays = Carbon::parse($actual->DocuDate)->diffInDays($today);
                
                if ($diffDays <= 7) {
                    $ratiosRecent[] = $ratio;
                } else {
                    $ratiosPrior[] = $ratio;
                }
            }
        }

        $avgRecent = !empty($ratiosRecent) ? array_sum($ratiosRecent) / count($ratiosRecent) : 1.0;
        $avgPrior = !empty($ratiosPrior) ? array_sum($ratiosPrior) / count($ratiosPrior) : 1.0;

        // Formula: Weighted Momentum (70% Recent, 30% Prior)
        $weightedRatio = ($avgRecent * 0.7) + ($avgPrior * 0.3);

        // Cap the multiplier between 0.7 - 1.3 for stability (Safety Caps)
        return max(0.7, min(1.3, $weightedRatio));
    }

    /**
     * Get Daily Averages across 2022-2025 for all 366 days
     */
    private function getHistoricalDailyAverages()
    {
        // Portable Median Calculation for older SQL Server Compatibility Modes
        $results = DB::connection('sqlsrv2')
            ->select("
                WITH DailySums AS (
                    SELECT 
                        DocuDate,
                        MONTH(DocuDate) as month,
                        DAY(DocuDate) as day,
                        SUM(GoodNet) / 1000.0 as daily_weight_ton
                    FROM Webapp_POInv
                    WHERE YEAR(DocuDate) BETWEEN 2022 AND 2025
                    GROUP BY DocuDate
                ),
                OrderedData AS (
                    SELECT 
                        month, 
                        day, 
                        daily_weight_ton as weight_ton,
                        ROW_NUMBER() OVER (PARTITION BY month, day ORDER BY daily_weight_ton) as rn,
                        COUNT(*) OVER (PARTITION BY month, day) as total
                    FROM DailySums
                )
                SELECT 
                    month, 
                    day, 
                    AVG(weight_ton) as median_weight
                FROM OrderedData
                WHERE rn IN ((total + 1) / 2, (total + 2) / 2)
                GROUP BY month, day
                ORDER BY month, day
            ");

        $averages = [];
        foreach ($results as $row) {
            $key = sprintf('%02d-%02d', $row->month, $row->day);
            $averages[$key] = $row->median_weight;
        }

        return $averages;
    }

    /**
     * Apply Moving Average
     */
    private function applyMovingAverage($data, $field, $period)
    {
        return $data->map(function($item, $index) use ($data, $field, $period) {
            $start = max(0, $index - $period + 1);
            $subset = $data->slice($start, $index - $start + 1)->pluck($field);
            $item->moving_avg = round($subset->avg(), 2);
            return $item;
        });
    }

    /**
     * Calculate Pearson Correlation Coefficient
     */
    private function calculateCorrelation($x, $y)
    {
        $n = count($x);
        if ($n === 0) return 0;

        $avgX = $x->avg();
        $avgY = $y->avg();

        $num = 0; $denX = 0; $denY = 0;

        for ($i = 0; $i < $n; $i++) {
            $diffX = $x[$i] - $avgX;
            $diffY = $y[$i] - $avgY;
            $num += ($diffX * $diffY);
            $denX += ($diffX * $diffX);
            $denY += ($diffY * $diffY);
        }

        $den = sqrt($denX * $denY);
        return $den === 0 ? 0 : $num / $den;
    }

    /**
     * Detect Volume Anomalies (Actual vs Forecast with 25% Threshold)
     */
    private function detectAnomalies($data, $seasonalAverages)
    {
        if (count($data) < 7) return [];

        // 1. Get current weighted performance ratio (Momentum)
        $ratio = $this->calculatePerformanceRatio($seasonalAverages);
        $currentAvg = $data->slice(-14)->avg('weight_ton');

        $anomalies = [];
        foreach ($data as $item) {
            $date = Carbon::parse($item->date);
            $dayMonthKey = $date->format('m-d');
            
            // Expected value based on robust median * current weighted ratio
            $expected = ($seasonalAverages[$dayMonthKey] ?? $currentAvg) * $ratio;
            
            // Scaling safety: Avoid dividing by near-zero or reporting noise for very low volumes
            if ($expected > 5 && $item->weight_ton > 5) {
                $deviation = ($item->weight_ton - $expected) / $expected;
                
                // Anomaly Logic: Deviation > 25% (Actual < Forecast * 0.75)
                if (abs($deviation) > 0.25) {
                    $anomalies[] = [
                        'date' => $item->date,
                        'actual' => round($item->weight_ton, 2),
                        'expected' => round($expected, 2),
                        'deviation_pct' => round($deviation * 100, 1),
                        'status' => $deviation < 0 ? 'DROP' : 'SPIKE',
                        'severity' => abs($deviation) > 0.5 ? 'CRITICAL' : 'WARNING',
                        'message' => $deviation < 0 
                            ? 'ปริมาณตํ่ากว่าเป้าหมาย (Anomaly Detected)' 
                            : 'ปริมาณสูงกว่าปกติอย่างมีนัยสำคัญ'
                    ];
                }
            }
        }
        return array_slice($anomalies, -8); // Return recent anomalies
    }

    /**
     * Calculate Financial Impact (Revenue Forecast)
     */
    private function calculateFinancialImpact($forecast, $avgPrice)
    {
        $forecastTotalRevenue = 0;
        foreach ($forecast as $f) {
            $forecastTotalRevenue += ($f['weight_ton'] * $avgPrice);
        }

        return [
            'actual_total_revenue' => 0, // Placeholder for actual calc if needed
            'forecast_total_revenue' => round($forecastTotalRevenue, 2),
            'projected_avg_price' => round($avgPrice, 2),
            'insights' => [
                'revenue_trend' => 'STABLE',
                'opportunity_loss' => 0
            ]
        ];
    }

    private function calculatePriceMomentum($data)
    {
        if (count($data) < 7) return 0;
        
        $current = $data->slice(-7)->avg('avg_price');
        $prior = $data->slice(-14, 7)->avg('avg_price');
        
        if ($prior == 0) return 0;
        
        return round((($current / $prior) - 1) * 100, 2);
    }

    private function standardDeviation($arr)
    {
        $n = count($arr);
        if ($n === 0) return 0;
        $avg = array_sum($arr) / $n;
        $variance = 0;
        foreach ($arr as $i) $variance += pow($i - $avg, 2);
        return sqrt($variance / $n);
    }
}
