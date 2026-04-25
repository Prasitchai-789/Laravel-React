<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PRO\Production;

class PurchaseService
{
    protected $yieldService;

    public function __construct(YieldService $yieldService)
    {
        $this->yieldService = $yieldService;
    }

    /**
     * Get PO Invoice Dashboard Data (FFB Focus)
     */
    public function getPOInvDashboardData(string $date)
    {
        $carbonDate = Carbon::parse($date);
        $currentMonth = $carbonDate->month;
        $currentYear = $carbonDate->year;
        $todayStr = $carbonDate->format('Y-m-d');
        
        $baseQuery = fn() => DB::connection('sqlsrv2')->table('Webapp_POInv');

        // Today Data
        $todayStats = $baseQuery()
            ->whereDate('DocuDate', $todayStr)
            ->select(
                DB::raw('SUM(GoodNet) / 1000.0 as total_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )->first();

        // Monthly Data
        $monthStats = $baseQuery()
            ->whereYear('DocuDate', $currentYear)
            ->whereMonth('DocuDate', $currentMonth)
            ->whereDate('DocuDate', '<=', $todayStr)
            ->select(
                DB::raw('SUM(GoodNet) / 1000.0 as total_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )->first();

        // Previous Year Monthly
        $prevYearDate = $carbonDate->copy()->subYear();
        $monthStatsPrevYear = $baseQuery()
            ->whereYear('DocuDate', $prevYearDate->year)
            ->whereMonth('DocuDate', $prevYearDate->month)
            ->whereDate('DocuDate', '<=', $prevYearDate->format('Y-m-d'))
            ->select(
                DB::raw('SUM(GoodNet) / 1000.0 as total_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb')
            )->first();

        // Trend 7 Days
        $sevenDaysAgo = $carbonDate->copy()->subDays(6)->startOfDay();
        $trend = $baseQuery()
            ->whereBetween('DocuDate', [$sevenDaysAgo, $carbonDate->copy()->endOfDay()])
            ->select(
                DB::raw('CONVERT(varchar, DocuDate, 23) as date'),
                DB::raw('SUM(GoodNet) / 1000.0 as weight_ton'),
                DB::raw('SUM(Amnt2) / 1000000.0 as total_mb'),
                DB::raw('CASE WHEN SUM(GoodNet) > 0 THEN SUM(Amnt2) / SUM(GoodNet) ELSE 0 END as avg_price')
            )
            ->groupBy(DB::raw('CONVERT(varchar, DocuDate, 23)'))
            ->get();

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

        // Top 5 Vendors
        $top5 = $baseQuery()
            ->leftJoin('EMVendor', 'Webapp_POInv.VendorCode', '=', 'EMVendor.VendorCode')
            ->whereYear('Webapp_POInv.DocuDate', $currentYear)
            ->whereMonth('Webapp_POInv.DocuDate', $currentMonth)
            ->whereDate('Webapp_POInv.DocuDate', '<=', $todayStr)
            ->select(
                DB::raw("CASE WHEN EMVendor.VendorTitle IS NULL OR EMVendor.VendorTitle = '' THEN ISNULL(EMVendor.VendorName, Webapp_POInv.VendorCode) ELSE EMVendor.VendorTitle + ' ' + ISNULL(EMVendor.VendorName, '') END as vendor_name"),
                DB::raw('SUM(Webapp_POInv.GoodNet) / 1000.0 as volume_ton')
            )
            ->groupBy('EMVendor.VendorTitle', 'EMVendor.VendorName', 'Webapp_POInv.VendorCode')
            ->orderByDesc('volume_ton')
            ->limit(5)
            ->get();

        // Stock Calculation
        $production = Production::whereDate('Date', '<=', $todayStr)->orderBy('Date', 'desc')->first();
        $ffbRemain = $production ? floatval($production->FFBRemain ?? 0) : 0;
        
        // Use YieldService for 7-day yield
        $yields = $this->yieldService->getYieldSummary($startDate = $carbonDate->copy()->subDays(6), $endDate = $carbonDate);
        $yield7Days = $yields['yield_7d'];

        $avgFfbPrice = $todayStats->avg_price > 0 ? $todayStats->avg_price : $monthStats->avg_price;

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
            'top5' => $top5->map(fn($v) => ['name' => $v->vendor_name, 'volume' => round((float)$v->volume_ton, 0)]),
            'remaining_stock' => [
                'volume' => round($ffbRemain, 2),
                'amount_mb' => round(($ffbRemain * (float)$avgFfbPrice) / 1000.0, 2),
                'cpo_volume' => round(($ffbRemain * $yield7Days) / 100.0, 2),
                'yield_7d' => round($yield7Days, 2),
                'avg_ffb_price' => round((float)$avgFfbPrice, 2),
            ]
        ];
    }

    /**
     * Get Purchase Summary Data by Department
     */
    public function getPurchaseSummaryByDept($year, $month = null, $deptId = null)
    {
        $query = DB::connection('sqlsrv2')
            ->table('POHD')
            ->join('EMDept', 'EMDept.DeptID', '=', 'POHD.DeptID')
            ->leftJoin('POInvHD', 'POInvHD.PONo', '=', 'POHD.AppvDocuNo')
            ->leftJoin('GLHD', 'GLHD.DocuNo', '=', 'POInvHD.DocuNo')
            ->select(
                'POHD.DeptID',
                'EMDept.DeptName',
                DB::raw('SUM(POHD.SumGoodAmnt) as TotalBase'),
                DB::raw('SUM(GLHD.TotaAmnt) as TotalNet')
            )
            ->whereYear('POHD.DocuDate', $year)
            ->whereNotNull('POHD.POVendorNo')
            ->whereNotNull('RefDocuNo')
            ->where('POHD.DocuType', 305);

        if ($month) $query->whereMonth('POHD.DocuDate', $month);
        if ($deptId) $query->where('POHD.DeptID', $deptId);

        return $query->groupBy('POHD.DeptID', 'EMDept.DeptName')
            ->orderBy('EMDept.DeptName', 'asc')
            ->get();
    }

    /**
     * Get PO Invoice Detailed Report Data
     */
    public function getPOInvDetailedReport($year, $month = null, $branchId = 0)
    {
        $query = DB::connection('sqlsrv2')
            ->table('POInvHD')
            ->leftJoin('POInvDT', 'POInvHD.POInvID', '=', 'POInvDT.POInvID')
            ->leftJoin('EMVendor', 'POInvHD.VendorID', '=', 'EMVendor.VendorID')
            ->leftJoin('EMDept', 'POInvHD.DeptID', '=', 'EMDept.DeptID')
            ->leftJoin('EMGood', 'POInvDT.GoodID', '=', 'EMGood.GoodID')
            ->select([
                'POInvHD.DocuDate', 'POInvHD.DocuNo', 'POInvHD.InvNo', 'POInvHD.PONo',
                'POInvHD.NetAmnt', 'POInvDT.GoodName', 'POInvDT.GoodQty2', 'POInvDT.GoodPrice2',
                'EMVendor.VendorName', 'EMDept.DeptName', 'EMGood.GoodCode'
            ])
            ->where('POInvHD.DocuType', 309)
            ->whereYear('POInvHD.DocuDate', $year);

        if ($month) $query->whereMonth('POInvHD.DocuDate', $month);
        if ($branchId != 0) $query->where('POInvHD.BrchID', $branchId);

        return $query->get();
    }

    /**
     * Get PO Invoice Summary by GoodID
     */
    public function getPOInvSummary($start_date, $end_date, $good_id = 2156)
    {
        return \App\Models\WIN\POInvDT::selectRaw('
            GoodID,
            SUM(GoodStockQty) as total_qty,
            SUM(GoodAmnt) as total_amount,
            ROUND(CASE WHEN SUM(GoodStockQty) = 0 THEN 0 ELSE SUM(GoodAmnt) / SUM(GoodStockQty) END, 2) as avg_price
        ')
            ->where('GoodID', $good_id)
            ->whereHas('poHD', function ($query) use ($start_date, $end_date) {
                $query->whereBetween('DocuDate', [$start_date, $end_date])
                    ->whereIn('DocuType', [309, 312]);
            })
            ->groupBy('GoodID')
            ->get();
    }

    /**
     * Get PO Invoice Monthly Trend by GoodID
     */
    public function getPOInvMonthly($start_date, $end_date, $good_id = 2156)
    {
        return \App\Models\WIN\POInvDT::selectRaw('
            MONTH(poHD.DocuDate) as month,
            YEAR(poHD.DocuDate) as year,
            SUM(POInvDT.GoodStockQty) as total_qty,
            SUM(POInvDT.GoodAmnt) as total_amount,
            ROUND(CASE WHEN SUM(POInvDT.GoodStockQty) = 0 THEN 0 ELSE SUM(POInvDT.GoodAmnt) / SUM(POInvDT.GoodStockQty) END, 2) as avg_price
        ')
            ->join('POInvHD as poHD', 'POInvDT.POInvID', '=', 'poHD.POInvID')
            ->where('POInvDT.GoodID', $good_id)
            ->whereBetween('poHD.DocuDate', [$start_date, $end_date])
            ->whereIn('poHD.DocuType', [309, 312])
            ->groupByRaw('YEAR(poHD.DocuDate), MONTH(poHD.DocuDate)')
            ->orderByRaw('YEAR(poHD.DocuDate), MONTH(poHD.DocuDate)')
            ->get();
    }

    /**
     * Get PO List with Pagination
     */
    public function getPOList($deptId, $year, $month = null, $perPage = 10, $page = 1)
    {
        $query = \App\Models\WIN\POHD::on('sqlsrv2')
            ->with(['poInv.glHeader', 'department'])
            ->where('DeptID', $deptId)
            ->whereYear('DocuDate', $year)
            ->where('POHD.DocuType', 305)
            ->whereNotNull('POVendorNo')
            ->whereNotNull('RefDocuNo')
            ->whereNotNull('AppvDocuNo')
            ->orderBy('DocuDate', 'desc');

        if ($month) {
            $monthNum = (int)substr($month, 5, 2);
            $query->whereMonth('DocuDate', $monthNum);
        }

        $data = $query->paginate($perPage, ['*'], 'page', $page);
        
        $mapped = collect($data->items())->map(fn($po) => [
            'POID' => $po->POID,
            'DocuDate' => $po->DocuDate,
            'DeptName' => $po->department?->DeptName,
            'POVendorNo' => $po->POVendorNo,
            'RefDocuNo' => $po->RefDocuNo,
            'AppvDocuNo' => $po->AppvDocuNo,
            'status' => !empty($po->AppvDocuNo) ? 'approved' : 'pending',
            'total_amount' => $po->poInv?->glHeader?->TotaAmnt ?? null,
        ]);

        return [
            'items' => $mapped,
            'total' => $data->total(),
            'current_page' => $data->currentPage(),
            'last_page' => $data->lastPage(),
        ];
    }

    /**
     * Get PO Inv Chart Data
     */
    public function getPOInvChartData($year, $month = null, $deptId = null, $branchId = null)
    {
        $baseQuery = DB::connection('sqlsrv2')
            ->table('POInvHD')
            ->join('EMDept', 'POInvHD.DeptID', '=', 'EMDept.DeptID')
            ->where('POInvHD.DocuType', 309)
            ->where('POInvHD.MultiCurr', 'N')
            ->whereYear('POInvHD.DocuDate', $year);

        if ($month) {
            $monthPart = explode('-', $month);
            $baseQuery->whereMonth('POInvHD.DocuDate', (int)($monthPart[1] ?? $monthPart[0]));
        }
        if ($branchId) $baseQuery->where('POInvHD.BrchID', $branchId);

        $byDept = (clone $baseQuery)
            ->select('POInvHD.DeptID', 'EMDept.DeptName', DB::raw('SUM(POInvHD.NetAmnt) as totalNet'))
            ->groupBy('POInvHD.DeptID', 'EMDept.DeptName')
            ->get();

        $byMonth = collect();
        if ($deptId) {
            $byMonth = DB::connection('sqlsrv2')
                ->table('POInvHD')
                ->select(DB::raw('MONTH(DocuDate) as month'), DB::raw('SUM(NetAmnt) as totalNet'))
                ->where('DeptID', $deptId)
                ->whereYear('DocuDate', $year)
                ->groupByRaw('MONTH(DocuDate)')
                ->get();
        }

        return ['byDept' => $byDept, 'byMonth' => $byMonth];
    }
}
