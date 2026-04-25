<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class YieldService
{
    /**
     * Get all yield variations for a given period
     */
    public function getYieldSummary($startDate, $endDate)
    {
        $startDate = Carbon::parse($startDate);
        $endDate = Carbon::parse($endDate);
        
        $allCpoData = DB::table('cpo_data')->orderBy('id', 'desc')->get();
        
        // 1. & 2. Standard Yields (Sales-based)
        $standardYields = $this->calculateStandardYields($startDate, $endDate, $allCpoData);
        
        // 3. Monthly Production Yield (Matching days from start of month)
        $monthlyProductionYield = $this->calculateProductionYield($endDate->copy()->startOfMonth(), $endDate, $allCpoData);
        
        // 4. 7-Day Trailing Yield (Matching days)
        $sevenDayYield = $this->calculateProductionYield($endDate->copy()->subDays(6), $endDate, $allCpoData);

        return [
            'yield_monthly' => round($standardYields['yield_period'], 2),
            'yield_oil_room' => round($standardYields['yield_with_oil_room'], 2),
            'yield_production_monthly' => round($monthlyProductionYield, 2),
            'yield_7d' => round($sevenDayYield, 2),
            'details' => [
                'standard' => $standardYields,
                'matching_monthly' => $monthlyProductionYield,
                'matching_7d' => $sevenDayYield
            ]
        ];
    }

    /**
     * Standard formula: (Closing - Opening + Sales) / FFB
     */
    protected function calculateStandardYields($startDate, $endDate, $allCpoData)
    {
        $cpoDataAtEnd = null;
        foreach ($allCpoData as $row) {
            try {
                if (Carbon::parse(substr($row->date, 0, 11))->lte($endDate)) {
                    $cpoDataAtEnd = $row;
                    break;
                }
            } catch (\Exception $e) { continue; }
        }

        $openingStockData = DB::table('cpo_data')
            ->whereDate('date', '<', $startDate->format('Y-m-d'))
            ->orderBy('date', 'desc')
            ->first();

        $openingStock = (float)($openingStockData->total_cpo ?? 0);
        $closingStock = (float)($cpoDataAtEnd->total_cpo ?? 0);
        $latestOilRoom = (float)($cpoDataAtEnd->cpo_oil_room ?? 0);

        $periodCpoSales = DB::connection('sqlsrv2')->table('SOInvDT')
            ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
            ->where('SOInvDT.GoodID', 2147)
            ->whereIn('SOInvHD.DocuType', [107, 108])
            ->whereBetween('SOInvHD.DocuDate', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->sum(DB::raw('GoodStockQty / 1000.0'));

        $periodGoodQty = DB::connection('sqlsrv3')->table('productions')
            ->whereBetween('Date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->whereNull('deleted_at')
            ->sum('FFBGoodQty') ?? 0;

        $productionNoOilRoom = ($closingStock - $openingStock) + $periodCpoSales;
        $productionWithOilRoom = $productionNoOilRoom + $latestOilRoom;

        return [
            'yield_period' => $periodGoodQty > 0 ? ($productionNoOilRoom / $periodGoodQty) * 100 : 0,
            'yield_with_oil_room' => $periodGoodQty > 0 ? ($productionWithOilRoom / $periodGoodQty) * 100 : 0,
            'ffb_qty' => $periodGoodQty,
            'sales_qty' => $periodCpoSales,
            'stock_diff' => $closingStock - $openingStock
        ];
    }

    /**
     * Production-based yield: sum(product_cpo) / sum(FFBGoodQty) for matching days
     */
    protected function calculateProductionYield($start, $end, $allCpoData)
    {
        $productions = DB::connection('sqlsrv3')->table('productions')
            ->whereBetween('Date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
            ->whereNull('deleted_at')
            ->orderBy('Date', 'desc')
            ->get();

        $sumFfb = 0;
        $sumCpo = 0;
        
        foreach ($productions as $p) {
            $pDate = Carbon::parse($p->Date)->format('Y-m-d');
            foreach ($allCpoData as $c) {
                try {
                    $cDate = Carbon::parse(substr($c->date, 0, 11))->format('Y-m-d');
                    if ($pDate === $cDate && (float)$c->product_cpo > 0 && (float)$p->FFBGoodQty > 0) {
                        $sumFfb += (float)$p->FFBGoodQty;
                        $sumCpo += (float)$c->product_cpo;
                        break;
                    }
                } catch (\Exception $e) { continue; }
            }
        }

        return $sumFfb > 0 ? ($sumCpo / $sumFfb) * 100 : 0;
    }
}
