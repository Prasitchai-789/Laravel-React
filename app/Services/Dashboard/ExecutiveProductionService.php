<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ExecutiveProductionService
{
    protected $sqlsrv;
    protected $sqlsrv2;
    protected $sqlsrv3;
    protected $yieldService;

    public function __construct(YieldService $yieldService)
    {
        $this->sqlsrv = DB::connection('sqlsrv');
        $this->sqlsrv2 = DB::connection('sqlsrv2');
        $this->sqlsrv3 = DB::connection('sqlsrv3');
        $this->yieldService = $yieldService;
    }

    public function getProductionReportData($startDate, $endDate)
    {
        $startDate = Carbon::parse($startDate);
        $endDate = Carbon::parse($endDate);

        // 1. FFB Input from sqlsrv3 (Sum of FFBGoodQty for the period)
        $goodQty = $this->sqlsrv3->table('productions')
            ->whereBetween('Date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereNull('deleted_at')
            ->sum('FFBGoodQty') ?? 0;

        // 2. Production Volumes (Derived from Stock Diff + Sales)
        // CPO uses 'cpo_data' table and 'date' column
        $cpoProduction = $this->calculateProduction(2147, $startDate, $endDate, 'cpo_data', 'total_cpo', 'date');

        // Others use 'stock_products' table and 'record_date' column
        $pknProduction = $this->calculateProduction(2152, $startDate, $endDate, 'stock_products', 'pkn', 'record_date');
        $shellProduction = $this->calculateProduction(2151, $startDate, $endDate, 'stock_products', 'shell', 'record_date');
        $fiberProduction = $this->calculateProduction(9012, $startDate, $endDate, 'stock_products', 'efb_fiber', 'record_date');

        // 3. Prices (Average selling price for the period to calculate MB)
        $prices = [
            'cpo' => $this->getAvgSalesPrice(2147, $startDate, $endDate),
            'pkn' => $this->getAvgSalesPrice(2152, $startDate, $endDate),
            'shell' => $this->getAvgSalesPrice(2151, $startDate, $endDate),
            'fiber' => $this->getAvgSalesPrice(9012, $startDate, $endDate),
        ];

        // 4. Stock Levels (Latest available)
        $latestStock = $this->sqlsrv->table('stock_products')
            ->whereDate('record_date', '<=', $endDate)
            ->orderBy('record_date', 'desc')
            ->first();

        $cpoStock = $this->sqlsrv->table('cpo_data')
            ->whereDate('date', '<=', $endDate)
            ->orderBy('date', 'desc')
            ->first();

        // 5. Consolidated Data
        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
                'ffb_input' => round($goodQty, 2),
            ],
            'production' => [
                'cpo' => [
                    'volume' => round((float)$cpoProduction, 2),
                    'yield' => $goodQty > 0 ? round(($cpoProduction / $goodQty) * 100, 2) : 0,
                    'price' => round($prices['cpo'], 2),
                    'amount_mb' => round(($cpoProduction * $prices['cpo']) / 1000, 2),
                ],
                'pkn' => [
                    'volume' => round((float)$pknProduction, 2),
                    'yield' => $goodQty > 0 ? round(($pknProduction / $goodQty) * 100, 2) : 0,
                    'price' => round($prices['pkn'], 2),
                    'amount_mb' => round(($pknProduction * $prices['pkn']) / 1000, 2),
                ],
                'shell' => [
                    'volume' => round($shellProduction, 2),
                    'yield' => $goodQty > 0 ? round(($shellProduction / $goodQty) * 100, 2) : 0,
                    'price' => round($prices['shell'], 2),
                    'amount_mb' => round(($shellProduction * $prices['shell']) / 1000, 2),
                ],
                'fiber' => [
                    'volume' => round($fiberProduction, 2),
                    'yield' => $goodQty > 0 ? round(($fiberProduction / $goodQty) * 100, 2) : 0,
                    'price' => round($prices['fiber'], 2),
                    'amount_mb' => round(($fiberProduction * $prices['fiber']) / 1000, 2),
                ],
            ],
            'stock' => [
                'cpo' => round((float)($cpoStock->total_cpo ?? 0), 2),
                'pkn' => round((float)($latestStock->pkn ?? 0), 2),
                'shell' => round((float)($latestStock->shell ?? 0), 2),
                'fiber' => round((float)($latestStock->efb_fiber ?? 0), 2),
                'ffb_remain' => round((float)($this->sqlsrv3->table('productions')->whereNull('deleted_at')->whereDate('Date', '<=', $endDate)->orderBy('Date', 'desc')->value('FFBRemain') ?? 0), 2),
            ]
        ];
    }

    protected function getAvgSalesPrice($goodId, $start, $end)
    {
        $data = $this->sqlsrv2->table('SOInvDT')
            ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
            ->where('SOInvDT.GoodID', $goodId)
            ->whereBetween('SOInvHD.DocuDate', [$start->toDateString(), $end->toDateString()])
            ->whereIn('SOInvHD.DocuType', [107, 108])
            ->select(
                DB::raw('SUM(GoodAmnt) as total_amnt'),
                DB::raw('SUM(GoodStockQty) as total_qty')
            )->first();

        return $data && $data->total_qty > 0 ? (float)($data->total_amnt / $data->total_qty) : 0;
    }

    protected function calculateProduction($goodId, $start, $end, $table, $column, $dateColumn = 'record_date')
    {
        // Stock at start of period (previous day's closing)
        $stockStart = $this->sqlsrv->table($table)
            ->whereDate($dateColumn, '<', $start->toDateString())
            ->orderBy($dateColumn, 'desc')
            ->value($column) ?? 0;

        // Stock at end of period
        $stockEnd = $this->sqlsrv->table($table)
            ->whereDate($dateColumn, '<=', $end->toDateString())
            ->orderBy($dateColumn, 'desc')
            ->value($column) ?? 0;

        // Sold Quantity during period (from SOPlan in sqlsrv2) - Using NetWei as per user request
        $soldQty = $this->sqlsrv2->table('SOPlan')
            ->where('GoodID', $goodId)
            ->whereBetween('SOPDate', [$start->startOfDay()->toDateTimeString(), $end->endOfDay()->toDateTimeString()])
            ->whereNull('deleted_at')
            ->sum('NetWei') ?? 0;

        // Formula: Production = (Stock_End - Stock_Start) + (Sold / 1000)
        // Since NetWei is likely in KG (consistent with AmntLoad/total_qty in other areas), we divide by 1000 to get Tons.
        return (float)$stockEnd - (float)$stockStart + ((float)$soldQty / 1000);
    }

    public function getSOPlanData($startDate, $endDate)
    {
        $startDate = Carbon::parse($startDate)->startOfDay();
        $endDate = Carbon::parse($endDate)->endOfDay();
        $goodIds = [2147, 2149, 2150, 2151, 2152, 9012];

        try {
            $data = $this->sqlsrv2->table('SOPlan')
                ->whereIn('GoodID', $goodIds)
                ->whereBetween('SOPDate', [$startDate->toDateTimeString(), $endDate->toDateTimeString()])
                ->whereNull('deleted_at')
                ->select(
                    'SOPID',
                    'SOPDate',
                    'GoodID',
                    'GoodName',
                    'AmntLoad',
                    'GoodPrice',
                    'GoodAmnt',
                    'CustID',
                    'Recipient',
                    'Status'
                )
                ->orderBy('SOPDate', 'asc')
                ->get();

            return $data;
        } catch (\Exception $e) {
            Log::error('Error fetching SOPlan data: ' . $e->getMessage());
            return collect([]);
        }
    }

    /**
     * Get Production Summary Card Data
     */
    public function getProductionSummaryCard($startDate, $endDate)
    {
        $startDate = Carbon::parse($startDate)->format('Y-m-d');
        $endDate = Carbon::parse($endDate)->format('Y-m-d');

        $carbonEndDate = Carbon::parse($endDate);
        $currentMonth = $carbonEndDate->month;
        $currentYear = $carbonEndDate->year;

        $baseQuery = fn() => $this->sqlsrv3->table('productions');

        $periodStats = $baseQuery()
            ->whereDate('Date', '>=', $startDate)
            ->whereDate('Date', '<=', $endDate)
            ->select(
                DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty'),
                DB::raw('ISNULL(SUM(ShiftA + ShiftB + Shift3 + PickupRemain + RamRemain), 0) as total_bins')
            )->first();

        $todayStats = $baseQuery()
            ->whereDate('Date', $endDate)
            ->select(
                DB::raw('ISNULL(SUM(TotalFFB), 0) as total_ffb'),
                DB::raw('ISNULL(SUM(FFBGoodQty), 0) as good_qty'),
                DB::raw('ISNULL(MAX(FFBRemain), 0) as ffb_remain'),
                DB::raw('ISNULL(SUM(ShiftA + ShiftB + Shift3 + PickupRemain + RamRemain), 0) as total_bins')
            )->first();

        if (!$todayStats || $todayStats->ffb_remain == 0) {
            $latestRemain = $baseQuery()->whereDate('Date', '<=', $endDate)->orderBy('Date', 'desc')->select('FFBRemain')->first();
            if ($latestRemain) $todayStats->ffb_remain = $latestRemain->FFBRemain;
        }

        return [
            'period' => [
                'total_ffb' => round((float)$periodStats->total_ffb, 3),
                'good_qty' => round((float)$periodStats->good_qty, 3),
                'avg_weight_per_bin' => round((float)($periodStats->total_bins > 0 ? $periodStats->total_ffb / $periodStats->total_bins : 0), 3)
            ],
            'today' => [
                'total_ffb' => round((float)$todayStats->total_ffb, 3),
                'good_qty' => round((float)$todayStats->good_qty, 3),
                'ffb_remain' => round((float)($todayStats->ffb_remain ?? 0), 3),
                'avg_weight_per_bin' => round((float)($todayStats->total_bins > 0 ? $todayStats->total_ffb / $todayStats->total_bins : 0), 3)
            ]
        ];
    }

    /**
     * Get CPO Summary (Stock + Yield + Tanks)
     */
    public function getCPOSummary($startDate, $endDate)
    {
        $startDate = Carbon::parse($startDate);
        $endDate = Carbon::parse($endDate);

        $allCpoData = DB::table('cpo_data')->orderBy('id', 'desc')->get();
        $cpoData = null;
        $periodProductCPOWithOilRoom = 0;

        foreach ($allCpoData as $row) {
            $cleanDateStr = substr($row->date, 0, 11);
            try {
                $rowDate = Carbon::parse($cleanDateStr);
                if (!$cpoData && $rowDate->lte($endDate)) $cpoData = $row;
                if ($rowDate->gte($startDate) && $rowDate->lte($endDate)) {
                    $periodProductCPOWithOilRoom += (float)($row->product_cpo ?? 0) + (float)($row->cpo_oil_room ?? 0);
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        $openingStockData = DB::table('cpo_data')->whereDate('date', '<', $startDate->format('Y-m-d'))->orderBy('date', 'desc')->first();
        $openingStock = (float)($openingStockData->total_cpo ?? 0);
        $closingStock = (float)($cpoData->total_cpo ?? 0);

        // Use YieldService for all yield variations
        $yields = $this->yieldService->getYieldSummary($startDate, $endDate);

        return [
            'total_stock' => round($closingStock, 3),
            'yield_percent' => $yields['yield_monthly'],
            'yield_period' => $yields['yield_monthly'],
            'yield_period_no_oil_room' => $yields['yield_production_monthly'], // Use production-based for cost
            'yield_oil_room' => $yields['yield_oil_room'],
            'yield_production_monthly' => $yields['yield_production_monthly'],
            'yield_7d' => $yields['yield_7d'],
            'period_good_qty' => round($yields['details']['standard']['ffb_qty'], 3),
            'tanks' => [
                'tank1' => round((float)($cpoData->tank1_cpo_volume ?? 0), 3),
                'tank2' => round((float)($cpoData->tank2_cpo_volume ?? 0), 3),
                'tank3' => round((float)($cpoData->tank3_cpo_volume ?? 0), 3),
                'tank4' => round((float)($cpoData->tank4_cpo_volume ?? 0), 3),
                'oil_room' => round((float)($cpoData->cpo_oil_room ?? 0), 3),
            ],
            'history' => $this->getCPOSparklineHistory($endDate, $allCpoData)
        ];
    }

    private function getCPOSparklineHistory($endDate, $allCpoData)
    {
        $startDate = (clone $endDate)->subDays(6);
        $ffbHistoryRaw = $this->sqlsrv3->table('productions')->whereBetween('Date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])->get();

        $history = [];
        for ($i = 6; $i >= 0; $i--) {
            $targetDate = (clone $endDate)->subDays($i);
            $foundData = null;
            foreach ($allCpoData as $row) {
                try {
                    $rowDate = Carbon::parse(substr($row->date, 0, 11));
                    if ($rowDate->lte($targetDate)) {
                        $foundData = $row;
                        break;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }
            $foundFFB = null;
            foreach ($ffbHistoryRaw as $row) {
                try {
                    if (Carbon::parse($row->Date)->isSameDay($targetDate)) {
                        $foundFFB = $row;
                        break;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }
            $history[] = [
                'date' => $targetDate->format('Y-m-d'),
                'volume' => $foundData ? (float)$foundData->total_cpo : 0,
                'ffb_good_qty' => $foundFFB ? (float)$foundFFB->FFBGoodQty : 0
            ];
        }
        return $history;
    }

    /**
     * Get Purchase Summary Card
     */
    public function getPurchaseSummaryCard($startDate, $endDate, $goodId = 2156)
    {
        $startDate = Carbon::parse($startDate)->format('Y-m-d');
        $endDate = Carbon::parse($endDate)->format('Y-m-d');
        $carbonEndDate = Carbon::parse($endDate);

        $baseQuery = fn() => $this->sqlsrv2->table('POInvDT')
            ->join('POInvHD', 'POInvDT.POInvID', '=', 'POInvHD.POInvID')
            ->where('POInvDT.GoodID', $goodId)
            ->whereIn('POInvHD.DocuType', [309, 312]);

        $periodStats = $baseQuery()
            ->whereBetween('POInvHD.DocuDate', [$startDate, $endDate])
            ->select(
                DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
            )->first();

        $todayStats = $baseQuery()
            ->whereDate('POInvHD.DocuDate', $endDate)
            ->select(
                DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
            )->first();

        $monthStats = $baseQuery()
            ->whereYear('POInvHD.DocuDate', $carbonEndDate->year)
            ->whereMonth('POInvHD.DocuDate', $carbonEndDate->month)
            ->select(
                DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price'),
                DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath')
            )->first();

        $lastYearMonthStats = $baseQuery()
            ->whereYear('POInvHD.DocuDate', $carbonEndDate->year - 1)
            ->whereMonth('POInvHD.DocuDate', $carbonEndDate->month)
            ->select(
                DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price'),
                DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath')
            )->first();

        $yoyPriceChange = $lastYearMonthStats && $lastYearMonthStats->avg_price > 0 ? (($monthStats->avg_price - $lastYearMonthStats->avg_price) / $lastYearMonthStats->avg_price) * 100 : 0;
        $yoyAmountChange = $lastYearMonthStats && $lastYearMonthStats->total_bath > 0 ? (($monthStats->total_bath - $lastYearMonthStats->total_bath) / $lastYearMonthStats->total_bath) * 100 : 0;

        return [
            'period' => [
                'volume_ton' => round((float)$periodStats->total_ton, 3),
                'amount_bath' => round((float)$periodStats->total_bath, 2),
                'avg_price' => round((float)$periodStats->avg_price, 2)
            ],
            'today' => [
                'volume_ton' => round((float)$todayStats->total_ton, 3),
                'amount_bath' => round((float)$todayStats->total_bath, 2),
                'avg_price' => round((float)$todayStats->avg_price, 2)
            ],
            'monthly' => [
                'yoy_price_change_percent' => round((float)$yoyPriceChange, 2),
                'yoy_amount_change_percent' => round((float)$yoyAmountChange, 2)
            ]
        ];
    }
}
