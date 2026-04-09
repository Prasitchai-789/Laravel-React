<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SOInvController extends Controller
{
    /**
     * ดึงข้อมูลสรุปการขายสินค้า (SOInvDT + SOInvHD) 
     * รองรับวันนี้, เดือนนี้, ปีนี้ และ ช่วงเวลาที่เลือก
     */
    public function getSalesSummaryCardApi(Request $request)
    {
        try {
            $startDateInput = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
            $endDateInput = $request->input('end_date', Carbon::today()->format('Y-m-d'));
            $good_id = $request->input('good_id');

            if (!$good_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'good_id is required'
                ], 400);
            }

            $startDate = Carbon::parse($startDateInput)->format('Y-m-d');
            $endDate = Carbon::parse($endDateInput)->format('Y-m-d');
            $carbonEndDate = Carbon::parse($endDate);
            $currentMonth = $carbonEndDate->month;
            $currentYear = $carbonEndDate->year;

            // Base query for ACTUAL sales (from Invoices)
            $baseQuery = function() use ($good_id) {
                return DB::connection('sqlsrv2')
                    ->table('SOInvDT')
                    ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
                    ->where('SOInvDT.GoodID', $good_id)
                    ->whereIn('SOInvHD.DocuType', [107, 108]);
            };

            // Base query for PLANNED sales (from SOPlan)
            $basePlanQuery = function() use ($good_id) {
                return DB::connection('sqlsrv2')
                    ->table('SOPlan')
                    ->where('GoodID', $good_id)
                    ->whereNull('deleted_at');
            };

            // 1. Period Stats
            $periodStats = $baseQuery()
                ->whereDate('SOInvHD.DocuDate', '>=', $startDate)
                ->whereDate('SOInvHD.DocuDate', '<=', $endDate)
                ->select(DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'))->first();
            $periodPlan = $basePlanQuery()
                ->whereDate('SOPDate', '>=', $startDate)
                ->whereDate('SOPDate', '<=', $endDate)
                ->sum('AmntLoad') ?? 0;

            // 2. Today Stats
            $todayStats = $baseQuery()
                ->whereDate('SOInvHD.DocuDate', $endDate)
                ->select(DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'))->first();
            $todayPlan = $basePlanQuery()
                ->whereDate('SOPDate', $endDate)
                ->sum('AmntLoad') ?? 0;

            // 3. Monthly Stats
            $monthStats = $baseQuery()
                ->whereYear('SOInvHD.DocuDate', $currentYear)
                ->whereMonth('SOInvHD.DocuDate', $currentMonth)
                ->select(DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'))->first();
            $monthPlan = $basePlanQuery()
                ->whereYear('SOPDate', $currentYear)
                ->whereMonth('SOPDate', $currentMonth)
                ->sum('AmntLoad') ?? 0;

            // 4. Yearly Stats
            $yearStats = $baseQuery()
                ->whereYear('SOInvHD.DocuDate', $currentYear)
                ->select(DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'))->first();
            $yearPlan = $basePlanQuery()
                ->whereYear('SOPDate', $currentYear)
                ->sum('AmntLoad') ?? 0;

            return response()->json([
                'status' => 'success',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'good_id' => $good_id,
                'data' => [
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
                    ],
                    'yearly' => [
                        'volume_ton' => round((float)$yearPlan / 1000.0, 3),
                        'amount_bath' => round((float)$yearStats->total_bath, 2),
                        'avg_price' => $yearPlan > 0 ? round((float)$yearStats->total_bath / $yearPlan, 2) : 0
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
