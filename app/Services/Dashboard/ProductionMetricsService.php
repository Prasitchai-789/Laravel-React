<?php

namespace App\Services\Dashboard;

use App\Models\PRO\Production;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProductionMetricsService
{
    /**
     * ดึงข้อมูล Realtime เช่นเวลาเริ่มงาน ชั่วโมงทำงาน
     */
    public function getRealtimeData(string $date): array
    {
        return Cache::remember("dashboard.realtime.{$date}", 60, function () use ($date) {
            
            // เวลาเริ่มงานจริง: หาเวลาของกะบะแรกในรอบวันจาก DT
            $firstDt = DB::connection('sqlsrv3')
                ->table('Webapp_CountTrainDT')
                ->join('Webapp_CountTrainHD', 'Webapp_CountTrainDT.CTID', '=', 'Webapp_CountTrainHD.CTID')
                ->whereDate('Webapp_CountTrainHD.created_at', $date)
                ->orderBy('Webapp_CountTrainDT.created_at', 'asc')
                ->select('Webapp_CountTrainDT.created_at')
                ->first();

            $elapsedMinutes = 0;
            $now = Carbon::now('Asia/Bangkok');
            $isToday = ($date === Carbon::today()->format('Y-m-d'));

            $startTime = ($firstDt && $firstDt->created_at) 
                ? Carbon::parse($firstDt->created_at)->format('H:i') 
                : '-';

            $elapsedMinutes = 0;
            if ($firstDt && $firstDt->created_at) {
                $start = Carbon::parse($firstDt->created_at, 'Asia/Bangkok');
                
                if ($date === Carbon::today()->format('Y-m-d')) {
                    $now = Carbon::now('Asia/Bangkok');
                } else {
                    $lastDt = DB::connection('sqlsrv3')
                        ->table('Webapp_CountTrainDT')
                        ->join('Webapp_CountTrainHD', 'Webapp_CountTrainDT.CTID', '=', 'Webapp_CountTrainHD.CTID')
                        ->whereDate('Webapp_CountTrainHD.created_at', $date)
                        ->orderBy('Webapp_CountTrainDT.created_at', 'desc')
                        ->select('Webapp_CountTrainDT.created_at')
                        ->first();
                    $now = $lastDt ? Carbon::parse($lastDt->created_at, 'Asia/Bangkok') : $start->copy();
                }
                
                $elapsedMinutes = max(0, $start->diffInMinutes($now));
            }
            
            $totalHours = floor($elapsedMinutes / 60);
            $remainderMinutes = $elapsedMinutes % 60;
            
            $workingHours = $elapsedMinutes > 0 
                ? $totalHours . ':' . str_pad((string)$remainderMinutes, 2, '0', STR_PAD_LEFT)
                : '0:00';

            return [
                'start_time'      => $startTime,
                'working_hours'   => $workingHours,
                'elapsed_minutes' => $elapsedMinutes,
            ];
        });
    }

    /**
     * ดึงข้อมูล KPI เจาะจงวันที่ + แคช 5 นาที
     */
    public function getKPIData(string $date): array
    {
        return Cache::remember("dashboard.kpi.{$date}", 300, function () use ($date) {
            
            // 1. ยอดยกมา (Carry Over)
            $lastProdDay = Production::where('Date', '<', $date)
                ->orderBy('Date', 'desc')
                ->first();
            $carryOver = $lastProdDay ? floatval($lastProdDay->FFBRemain ?? 0) : 0;

            // 2. รับเข้า (Incoming)
            $incoming = DB::connection('sqlsrv2')
                ->table('Webapp_POInv')
                ->where('DocuDate', '=', $date)
                ->sum('GoodNet') / 1000;

            // 3. จำนวนกะบะ (Basket Count) 
            $basketCount = DB::connection('sqlsrv3')
                ->table('Webapp_CountTrainHD')
                ->whereDate('created_at', $date)
                ->sum('CTAmnt');

            // 4. ค่าเฉลี่ย 7 วันหลังสุด (Avg Pickup)
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
                'carry'      => round($carryOver, 2),
                'incoming'   => round($incoming, 2),
                'basket'     => $basketCount,
                'avg_pickup' => round($avgPickup7d, 3),
            ];
        });
    }

    /**
     * ดึงข้อมูลกราฟ Trend (7 วันล่าสุด) แบบ Batch Query + แคช 5 นาที 
     */
    public function getTrendData(string $date): array
    {
        return Cache::remember("dashboard.trend.{$date}", 300, function () use ($date) {
            
            $availableDates = Production::whereDate('Date', '<=', $date)
                ->orderBy('Date', 'desc')
                ->take(7)
                ->pluck('Date')
                ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
                ->reverse()
                ->values()
                ->toArray();

            if (empty($availableDates)) {
                return ['dates' => [], 'palm_input' => [], 'production' => [], 'yield' => [], 'yield_7_days' => 0];
            }

            // --- BATCH QUERIES ---
            $rawPalm = DB::connection('sqlsrv2')
                ->table('Webapp_POInv')
                ->whereIn('DocuDate', $availableDates)
                ->groupBy('DocuDate')
                ->selectRaw('DocuDate, SUM(GoodNet) / 1000.0 as total')
                ->pluck('total', 'DocuDate');
                
            $palmByDate = [];
            foreach ($rawPalm as $k => $v) {
                $cleanDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $k);
                $palmByDate[Carbon::parse($cleanDate)->format('Y-m-d')] = floatval($v);
            }

            $prodByDate = Production::whereIn('Date', $availableDates)
                ->get()
                ->keyBy(function($p) {
                    $cleanDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $p->Date);
                    return Carbon::parse($cleanDate)->format('Y-m-d');
                });

            $rawCpo = DB::table('cpo_data')
                ->whereIn('date', $availableDates)
                ->get();
                
            $cpoByDate = [];
            foreach ($rawCpo as $row) {
                $cleanDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $row->date);
                $cpoByDate[Carbon::parse($cleanDate)->format('Y-m-d')] = $row;
            }

            // --- Combine on Memory ---
            $trendDates = [];
            $palmInputTrend = [];
            $productionTrend = [];
            $yieldTrend = [];
            
            $sumFfb = 0;
            $sumCpo = 0;

            foreach ($availableDates as $d) {
                $trendDates[] = $d;
                $dayFfb = floatval($prodByDate[$d]->FFBGoodQty ?? 0);
                $dayCpo = floatval($cpoByDate[$d]->product_cpo ?? 0);
                
                $palmInputTrend[] = round(floatval($palmByDate[$d] ?? 0), 2);
                $productionTrend[] = round($dayFfb, 2);
                $yieldTrend[] = $dayFfb > 0 ? round(($dayCpo / $dayFfb) * 100, 2) : 0;
                
                $sumFfb += $dayFfb;
                $sumCpo += $dayCpo;
            }
            
            $yield7Days = $sumFfb > 0 ? ($sumCpo / $sumFfb) * 100 : 0;

            return [
                'dates'        => $trendDates,
                'palm_input'   => $palmInputTrend,
                'production'   => $productionTrend,
                'yield'        => $yieldTrend,
                'yield_7_days' => $yield7Days,
            ];
        });
    }
}
