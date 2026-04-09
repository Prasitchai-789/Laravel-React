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

    public function __construct()
    {
        $this->sqlsrv = DB::connection('sqlsrv');
        $this->sqlsrv2 = DB::connection('sqlsrv2');
        $this->sqlsrv3 = DB::connection('sqlsrv3');
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
}
