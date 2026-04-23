<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PRO\Production;

class POInvDashboardService
{
    public function getDashboardData(string $date)
    {
        $carbonDate = Carbon::parse($date);
        $currentMonth = $carbonDate->month;
        $currentYear = $carbonDate->year;
        $todayStr = $carbonDate->format('Y-m-d');
        
        // --- 1. Today Data ---
        $todayStats = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->whereDate('DocuDate', $todayStr)
            ->select(
                DB::raw('SUM(GoodNet) / 1000.0 as total_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )->first();

        // --- 2. Monthly Data ---
        $monthStats = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->whereYear('DocuDate', $currentYear)
            ->whereMonth('DocuDate', $currentMonth)
            ->whereDate('DocuDate', '<=', $todayStr)
            ->select(
                DB::raw('SUM(GoodNet) / 1000.0 as total_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )->first();

        // --- 2.1 Monthly Data (Previous Year - Same Period) ---
        $prevYearDate = $carbonDate->copy()->subYear();
        $prevYearTodayStr = $prevYearDate->format('Y-m-d');
        
        $monthStatsPrevYear = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->whereYear('DocuDate', $prevYearDate->year)
            ->whereMonth('DocuDate', $prevYearDate->month)
            ->whereDate('DocuDate', '<=', $prevYearTodayStr)
            ->select(
                DB::raw('SUM(GoodNet) / 1000.0 as total_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )->first();

        // --- 3. Trend 7 Days ---
        $sevenDaysAgo = $carbonDate->copy()->subDays(6)->startOfDay();
        $todayEnd = $carbonDate->copy()->endOfDay();
        
        $trend = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->where('DocuDate', '>=', $sevenDaysAgo)
            ->where('DocuDate', '<=', $todayEnd)
            ->select(
                DB::raw('CONVERT(varchar, DocuDate, 23) as date'),
                DB::raw('SUM(GoodNet) / 1000.0 as weight_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )
            ->groupBy(DB::raw('CONVERT(varchar, DocuDate, 23)'))
            ->get();

        // Normalize exactly 7 days
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $checkDate = $carbonDate->copy()->subDays($i)->format('Y-m-d');
            
            $found = $trend->firstWhere('date', $checkDate);

            $chartData[] = [
                'date' => Carbon::parse($checkDate)->translatedFormat('d M'),
                'volume' => $found ? round((float)$found->weight_ton, 2) : 0,
                'amount' => $found ? round((float)$found->total_mb, 2) : 0,
                'price' => $found ? round((float)$found->avg_price, 2) : 0,
            ];
        }

        // --- 4. Top 5 Vendors (Monthly) ---
        $top5 = DB::connection('sqlsrv2')
            ->table('Webapp_POInv')
            ->leftJoin('EMVendor', 'Webapp_POInv.VendorCode', '=', 'EMVendor.VendorCode')
            ->whereYear('Webapp_POInv.DocuDate', $currentYear)
            ->whereMonth('Webapp_POInv.DocuDate', $currentMonth)
            ->whereDate('Webapp_POInv.DocuDate', '<=', $todayStr)
            ->select(
                DB::raw("
                    CASE
                        WHEN EMVendor.VendorTitle IS NULL OR EMVendor.VendorTitle = ''
                        THEN ISNULL(EMVendor.VendorName, Webapp_POInv.VendorCode)
                        ELSE EMVendor.VendorTitle + ' ' + ISNULL(EMVendor.VendorName, '')
                    END as vendor_name
                "),
                DB::raw('SUM(Webapp_POInv.GoodNet) / 1000.0 as volume_ton')
            )
            ->groupBy('EMVendor.VendorTitle', 'EMVendor.VendorName', 'Webapp_POInv.VendorCode')
            ->orderByDesc('volume_ton')
            ->limit(5)
            ->get();

        // --- 5. Remaining Stock (from Production) ---
        $production = Production::whereDate('Date', '<=', $todayStr)
            ->orderBy('Date', 'desc')
            ->first();
        $ffbRemain = $production ? floatval($production->FFBRemain ?? 0) : 0;

        // --- 6. CPO Quantity Calculation (7-day Average Yield) ---
        $availableDates = Production::whereDate('Date', '<=', $todayStr)
            ->orderBy('Date', 'desc')
            ->take(7)
            ->pluck('Date')
            ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
            ->toArray();

        if (!empty($availableDates)) {
            $sumFfb7d = Production::whereIn('Date', $availableDates)->sum('FFBGoodQty');
            $sumCpo7d = DB::table('cpo_data')->whereIn('date', $availableDates)->sum('product_cpo');
            $yield7Days = $sumFfb7d > 0 ? ($sumCpo7d / $sumFfb7d) * 100 : 0;
        } else {
            $yield7Days = 0;
        }

        $yield7Days = round($yield7Days, 2);
        $cpoVolume = ($ffbRemain * $yield7Days) / 100.0;

        return [
            'today' => [
                'volume' => round((float)$todayStats->total_ton, 2),
                'amount_mb' => round((float)$todayStats->total_mb, 2),
                'avg_price' => round((float)$todayStats->avg_price, 2)
            ],
            'monthly' => [
                'volume' => round((float)$monthStats->total_ton, 2),
                'amount_mb' => round((float)$monthStats->total_mb, 2),
                'avg_price' => round((float)$monthStats->avg_price, 2),
                'volume_prev_year' => round((float)($monthStatsPrevYear->total_ton ?? 0), 2),
            ],
            'chart' => $chartData,
            'top5' => $top5->map(function($v) {
                return [
                    'name' => $v->vendor_name,
                    'volume' => round((float)$v->volume_ton, 0)
                ];
            }),
            'remaining_stock' => [
                'volume'        => round($ffbRemain, 2),
                'amount_mb'     => round(($ffbRemain * $todayStats->avg_price) / 1000.0, 2),
                'cpo_volume'    => round($cpoVolume, 2),
                'yield_7d'      => round($yield7Days, 2),
                // ราคาเฉลี่ย FFB ล่าสุด (฿/kg) — ใช้วันนี้ก่อน, fallback เดือนนี้
                'avg_ffb_price' => round(
                    ((float)$todayStats->avg_price > 0)
                        ? $todayStats->avg_price
                        : $monthStats->avg_price,
                    2
                ),
            ]
        ];
    }
}
