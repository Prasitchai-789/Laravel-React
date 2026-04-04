<?php

namespace App\Services\Production;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CycleTimeService
{
    /**
     * Get cycle time analytics for a specific date (defaults to today)
     */
    public function getCycleTimeAnalytics($date = null)
    {
        $date = $date ?: Carbon::today()->format('Y-m-d');

        // 1. Raw Data with LAG for diff_sec (SQL Server Syntax)
        // Categorize based on user requirements:
        // Normal: 10-240s
        // Slow: 240-600s
        // Downtime: > 600s
        // Noise: < 10s (Filtered out in next step)
        
        $rawSql = "
            WITH RawData AS (
                SELECT 
                    id, 
                    CTID as run_id, 
                    CTList as sequence, 
                    created_at as timestamp, 
                    CTGroupWork as shift,
                    LAG(created_at) OVER (PARTITION BY CTID ORDER BY created_at) as prev_timestamp
                FROM Webapp_CountTrainDT
                WHERE CAST(created_at AS DATE) = :date
            ),
            WithDiff AS (
                SELECT 
                    *,
                    DATEDIFF(SECOND, prev_timestamp, timestamp) as diff_sec
                FROM RawData
            )
            SELECT 
                *,
                CASE 
                    WHEN diff_sec < 10 THEN 'NOISE'
                    WHEN diff_sec <= 240 THEN 'NORMAL'
                    WHEN diff_sec <= 600 THEN 'SLOW'
                    ELSE 'DOWNTIME'
                END as status
            FROM WithDiff
            ORDER BY timestamp DESC
        ";

        $data = collect(DB::connection('sqlsrv3')->select($rawSql, ['date' => $date]));

        // 2. Filter Noise and format
        $items = $data->filter(fn($item) => $item->status !== 'NOISE' || is_null($item->prev_timestamp))
            ->map(function($item) {
                return (object)[
                    'id' => $item->id,
                    'run_id' => $item->run_id,
                    'sequence' => $item->sequence,
                    'timestamp' => $item->timestamp,
                    'shift' => $item->shift,
                    'diff_sec' => $item->diff_sec,
                    'status' => $item->status
                ];
            });

        // 3. Calculate Moving Average (Window of 5)
        $itemsWithMA = $this->applyMovingAverage($items->reverse()->values(), 5);

        // 4. Calculate KPIs
        $normalCycles = $itemsWithMA->filter(fn($i) => $i->status === 'NORMAL');
        $avgCycleTime = $normalCycles->avg('diff_sec') ?: 0;
        
        $efficiency = $avgCycleTime > 0 ? (240 / $avgCycleTime) * 100 : 0;
        $downtimeCount = $itemsWithMA->filter(fn($i) => $i->status === 'DOWNTIME')->count();
        $slowCount = $itemsWithMA->filter(fn($i) => ($i->status ?? '') === 'SLOW')->count();

        // 5. Current Status (Latest event)
        $latest = $itemsWithMA->last();

        return [
            'items' => $itemsWithMA->reverse()->values(), // Return in reverse chronological for UI
            'kpis' => [
                'avg_cycle_time' => round($avgCycleTime, 1),
                'efficiency' => round($efficiency, 1),
                'downtime_count' => $downtimeCount,
                'slow_count' => $slowCount,
                'latest_status' => $latest ? $latest->status : 'OFFLINE',
                'latest_diff' => $latest ? $latest->diff_sec : 0,
            ]
        ];
    }

    /**
     * Apply Moving Average to smooth the trends
     */
    private function applyMovingAverage($items, $period)
    {
        $count = $items->count();
        
        return $items->map(function($item, $index) use ($items, $period, $count) {
            if ($item->diff_sec === null) {
                $item->moving_avg = null;
                return $item;
            }

            $start = max(0, $index - $period + 1);
            $subset = $items->slice($start, $index - $start + 1)->pluck('diff_sec')->filter();
            
            $item->moving_avg = $subset->count() > 0 ? round($subset->avg(), 1) : $item->diff_sec;
            return $item;
        });
    }
}
