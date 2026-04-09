<?php

namespace App\Http\Controllers\Api;

use App\Models\WIN\POInvDT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Carbon\Carbon;

class POInvController extends Controller
{
    public function getPOInvSummary(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            $good_id = $request->good_id ?: 2156;

            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            $poInvs = POInvDT::selectRaw('
                GoodID,
                SUM(GoodStockQty) as total_qty,
                SUM(GoodAmnt) as total_amount,
                ROUND(
                    CASE WHEN SUM(GoodStockQty) = 0 THEN 0 ELSE SUM(GoodAmnt) / SUM(GoodStockQty) END
                , 2) as avg_price
            ')
                ->where('GoodID', $good_id)
                ->whereHas('poHD', function ($query) use ($start_date, $end_date) {
                    $query->whereBetween('DocuDate', [$start_date, $end_date])
                        ->whereIn('DocuType', [309, 312]);
                })
                ->groupBy('GoodID')
                ->get();


            return response()->json([
                'status' => 'success',
                'data' => $poInvs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPOInvMonthly(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            $good_id = $request->good_id ?: 2156;

            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            $poInvs = POInvDT::selectRaw('
                MONTH(DocuDate) as month,
                SUM(GoodStockQty) as total_qty,
                SUM(GoodAmnt) as total_amount,
                ROUND(
                    CASE WHEN SUM(GoodStockQty) = 0 THEN 0 ELSE SUM(GoodAmnt) / SUM(GoodStockQty) END
                , 2) as avg_price
            ')
                ->join('POInvHD as poHD', 'POInvDT.POInvID', '=', 'poHD.POInvID')
                ->where('POInvDT.GoodID', $good_id)
                ->whereBetween('poHD.DocuDate', [$start_date, $end_date])
                ->whereIn('poHD.DocuType', [309, 312])
                ->groupByRaw('YEAR(poHD.DocuDate), MONTH(poHD.DocuDate)')
                ->orderByRaw('YEAR(poHD.DocuDate), MONTH(poHD.DocuDate)')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $poInvs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPurchaseSummaryCardApi(Request $request)
    {
        try {
            $startDateInput = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
            $endDateInput = $request->input('end_date', Carbon::today()->format('Y-m-d'));
            $good_id = $request->input('good_id', 2156);
            
            $startDate = Carbon::parse($startDateInput)->format('Y-m-d');
            $endDate = Carbon::parse($endDateInput)->format('Y-m-d');
            
            $carbonEndDate = Carbon::parse($endDate);
            $currentMonth = $carbonEndDate->month;
            $currentYear = $carbonEndDate->year;

            $baseQuery = function() use ($good_id) {
                return DB::connection('sqlsrv2')
                    ->table('POInvDT')
                    ->join('POInvHD', 'POInvDT.POInvID', '=', 'POInvHD.POInvID')
                    ->where('POInvDT.GoodID', $good_id)
                    ->whereIn('POInvHD.DocuType', [309, 312]);
            };

            // Period (ช่วงเวลาที่เลือก)
            $periodStats = $baseQuery()
                ->whereDate('POInvHD.DocuDate', '>=', $startDate)
                ->whereDate('POInvHD.DocuDate', '<=', $endDate)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            // Today (ใช้วันที่ end_date)
            $todayStats = $baseQuery()
                ->whereDate('POInvHD.DocuDate', $endDate)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            // Yesterday (วันก่อนหน้า end_date)
            $yesterdayDate = Carbon::parse($endDate)->subDay()->format('Y-m-d');
            $yesterdayStats = $baseQuery()
                ->whereDate('POInvHD.DocuDate', $yesterdayDate)
                ->select(
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            $priceChange = 0;
            if ($yesterdayStats && $yesterdayStats->avg_price > 0) {
                $priceChange = (($todayStats->avg_price - $yesterdayStats->avg_price) / $yesterdayStats->avg_price) * 100;
            }

            $amountChange = 0;
            if ($yesterdayStats && $yesterdayStats->total_bath > 0) {
                $amountChange = (($todayStats->total_bath - $yesterdayStats->total_bath) / $yesterdayStats->total_bath) * 100;
            }

            // Monthly
            $monthStats = $baseQuery()
                ->whereYear('POInvHD.DocuDate', $currentYear)
                ->whereMonth('POInvHD.DocuDate', $currentMonth)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            // Monthly Last Year (เดือนเดียวกันปีก่อนหน้า)
            $lastYear = $currentYear - 1;
            $lastYearMonthStats = $baseQuery()
                ->whereYear('POInvHD.DocuDate', $lastYear)
                ->whereMonth('POInvHD.DocuDate', $currentMonth)
                ->select(
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            $yoyPriceChange = 0;
            if ($lastYearMonthStats && $lastYearMonthStats->avg_price > 0) {
                $yoyPriceChange = (($monthStats->avg_price - $lastYearMonthStats->avg_price) / $lastYearMonthStats->avg_price) * 100;
            }

            $yoyAmountChange = 0;
            if ($lastYearMonthStats && $lastYearMonthStats->total_bath > 0) {
                $yoyAmountChange = (($monthStats->total_bath - $lastYearMonthStats->total_bath) / $lastYearMonthStats->total_bath) * 100;
            }

            // Yearly
            $yearStats = $baseQuery()
                ->whereYear('POInvHD.DocuDate', $currentYear)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            return response()->json([
                'status' => 'success',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'data' => [
                    'period' => [
                        'volume_ton' => round((float)$periodStats->total_ton, 3),
                        'amount_bath' => round((float)$periodStats->total_bath, 2),
                        'avg_price' => round((float)$periodStats->avg_price, 2)
                    ],
                    'today' => [
                        'volume_ton' => round((float)$todayStats->total_ton, 3),
                        'amount_bath' => round((float)$todayStats->total_bath, 2),
                        'avg_price' => round((float)$todayStats->avg_price, 2),
                        'price_change_percent' => round((float)$priceChange, 2),
                        'amount_change_percent' => round((float)$amountChange, 2)
                    ],
                    'monthly' => [
                        'volume_ton' => round((float)$monthStats->total_ton, 3),
                        'amount_bath' => round((float)$monthStats->total_bath, 2),
                        'avg_price' => round((float)$monthStats->avg_price, 2),
                        'yoy_price_change_percent' => round((float)$yoyPriceChange, 2),
                        'yoy_amount_change_percent' => round((float)$yoyAmountChange, 2)
                    ],
                    'yearly' => [
                        'volume_ton' => round((float)$yearStats->total_ton, 3),
                        'amount_bath' => round((float)$yearStats->total_bath, 2),
                        'avg_price' => round((float)$yearStats->avg_price, 2)
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
