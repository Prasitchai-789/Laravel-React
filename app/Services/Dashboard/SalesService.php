<?php

namespace App\Services\Dashboard;

use App\Models\MAR\SOPlan;
use App\Models\WIN\SOInvDT;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesService
{
    /**
     * Get Sales Summary Card Data (Today, Monthly, Yearly)
     */
    public function getSalesSummaryCard($startDate, $endDate, $goodId)
    {
        $startDate = Carbon::parse($startDate)->format('Y-m-d');
        $endDate = Carbon::parse($endDate)->format('Y-m-d');
        $carbonEndDate = Carbon::parse($endDate);
        
        $baseQuery = fn() => DB::connection('sqlsrv2')
            ->table('SOInvDT')
            ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
            ->where('SOInvDT.GoodID', $goodId)
            ->whereIn('SOInvHD.DocuType', [107, 108]);

        $basePlanQuery = fn() => DB::connection('sqlsrv2')
            ->table('SOPlan')
            ->where('GoodID', $goodId)
            ->whereNull('deleted_at');

        // Period
        $periodStats = $baseQuery()->whereBetween('SOInvHD.DocuDate', [$startDate, $endDate])->selectRaw('ISNULL(SUM(GoodAmnt), 0) as total_bath')->first();
        $periodPlan = $basePlanQuery()->whereBetween('SOPDate', [$startDate, $endDate])->sum('NetWei') ?? 0;

        // Today
        $todayStats = $baseQuery()->whereDate('SOInvHD.DocuDate', $endDate)->selectRaw('ISNULL(SUM(GoodAmnt), 0) as total_bath')->first();
        $todayPlan = $basePlanQuery()->whereDate('SOPDate', $endDate)->sum('NetWei') ?? 0;

        // Monthly
        $monthStats = $baseQuery()->whereYear('SOInvHD.DocuDate', $carbonEndDate->year)->whereMonth('SOInvHD.DocuDate', $carbonEndDate->month)->selectRaw('ISNULL(SUM(GoodAmnt), 0) as total_bath')->first();
        $monthPlan = $basePlanQuery()->whereYear('SOPDate', $carbonEndDate->year)->whereMonth('SOPDate', $carbonEndDate->month)->sum('NetWei') ?? 0;

        return [
            'period' => [
                'volume_ton' => round((float)$periodPlan / 1000.0, 3),
                'amount_bath' => round((float)$periodStats->total_bath, 2),
                'avg_price' => $periodPlan > 0 ? round((float)$periodStats->total_bath / $periodPlan, 2) : 0
            ],
            'today' => [
                'volume_ton' => round((float)$todayPlan / 1000.0, 3),
                'amount_bath' => round((float)$todayStats->total_bath, 2),
                'avg_price' => $todayPlan > 0 ? round((float)$todayStats->total_bath / $todayPlan, 2) : 0
            ],
            'monthly' => [
                'volume_ton' => round((float)$monthPlan / 1000.0, 3),
                'amount_bath' => round((float)$monthStats->total_bath, 2),
                'avg_price' => $monthPlan > 0 ? round((float)$monthStats->total_bath / $monthPlan, 2) : 0
            ]
        ];
    }

    /**
     * Get Detailed Sales Summary (By Products & Monthly Trends)
     */
    public function getSalesSummary($startDate, $endDate, $goodId = null)
    {
        $buildSalesQuery = function ($types) use ($startDate, $endDate, $goodId) {
            return SOInvDT::selectRaw('SOInvDT.GoodID, YEAR(invoice.DocuDate) as year, MONTH(invoice.DocuDate) as month, SUM(SOInvDT.GoodAmnt) as total_amount')
                ->join('SOInvHD as invoice', 'SOInvDT.SOInvID', '=', 'invoice.SOInvID')
                ->whereBetween('invoice.DocuDate', [$startDate, $endDate])
                ->whereIn('invoice.Docutype', $types)
                ->when($goodId, fn($q) => $q->where('SOInvDT.GoodID', $goodId))
                ->groupBy('SOInvDT.GoodID', DB::raw('YEAR(invoice.DocuDate)'), DB::raw('MONTH(invoice.DocuDate)'))
                ->get();
        };

        $buildWeightQuery = function () use ($startDate, $endDate, $goodId) {
            return SOPlan::selectRaw('SOPlan.GoodID, YEAR(SOPDate) as year, MONTH(SOPDate) as month, SUM(NetWei) as total_weight')
                ->whereBetween('SOPDate', [$startDate, $endDate])
                ->when($goodId, fn($q) => $q->where('GoodID', $goodId))
                ->groupBy('SOPlan.GoodID', DB::raw('YEAR(SOPDate)'), DB::raw('MONTH(SOPDate)'))
                ->get();
        };

        $sales = $buildSalesQuery([107, 108]);
        $returns = $buildSalesQuery([109]);
        $weights = $buildWeightQuery();

        $products = $sales->groupBy('GoodID')->map(function ($rows, $gid) use ($returns, $weights) {
            $sales_amount = $rows->sum('total_amount');
            $return_amount = $returns->where('GoodID', $gid)->sum('total_amount');
            $weight = $weights->where('GoodID', $gid)->sum('total_weight');
            $net = $sales_amount - $return_amount;
            return [
                'good_id' => $gid,
                'good_name' => $this->mapGoodName($gid),
                'sales_amount' => $sales_amount,
                'returns_amount' => $return_amount,
                'net_sales' => $net,
                'total_weight' => $weight,
                'average_price' => $weight > 0 ? round($net / $weight, 2) : 0,
            ];
        })->filter(fn($p) => !is_null($p['good_name']))->values();

        $monthlyTrends = collect(range(1, 12))->map(function ($m) use ($sales, $returns, $weights) {
            $sales_m = $sales->where('month', $m)->sum('total_amount');
            $returns_m = $returns->where('month', $m)->sum('total_amount');
            $weight_m = $weights->where('month', $m)->sum('total_weight');
            $net_sales = $sales_m - $returns_m;
            return [
                'month' => date('Y') . '-' . str_pad($m, 2, '0', STR_PAD_LEFT),
                'sales' => $sales_m,
                'returns' => $returns_m,
                'net_sales' => $net_sales,
                'average_price' => $weight_m > 0 ? round($net_sales / $weight_m, 2) : 0,
                'weight' => $weight_m,
            ];
        });

        return [
            'summary' => [
                'total_sales' => $sales->sum('total_amount'),
                'total_returns' => $returns->sum('total_amount'),
                'total_weight' => $weights->sum('total_weight'),
            ],
            'products' => $products,
            'monthly_trends' => $monthlyTrends
        ];
    }

    private function mapGoodName($id)
    {
        $names = [2147 => 'น้ำมันปาล์มดิบ', 2152 => 'เมล็ดในปาล์ม', 2151 => 'กะลา', 9012 => 'ทะลายสับ', 2149 => 'ทะลายปาล์มเปล่า', 2150 => 'ใยปาล์ม'];
        return $names[(int)$id] ?? null;
    }

    /**
     * Get Top Customers
     */
    public function getTopCustomers($limit = 5)
    {
        // Mocking for now as per controller logic
        return collect([
            ['name' => 'บริษัท A', 'net_sales' => 9500000, 'volume' => 380, 'avg_price' => 25.0],
            ['name' => 'บริษัท B', 'net_sales' => 7600000, 'volume' => 310, 'avg_price' => 24.5],
            ['name' => 'บริษัท C', 'net_sales' => 5400000, 'volume' => 220, 'avg_price' => 24.6],
            ['name' => 'บริษัท D', 'net_sales' => 4200000, 'volume' => 180, 'avg_price' => 23.8],
            ['name' => 'บริษัท E', 'net_sales' => 3500000, 'volume' => 150, 'avg_price' => 23.3],
        ])->take($limit);
    }
}
