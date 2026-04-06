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
            $good_id = $request->input('good_id'); // รหัสสินค้าที่ต้องการ
            
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

            // Base query for sales (Credit and Cash Sales)
            $baseQuery = function() use ($good_id) {
                return DB::connection('sqlsrv2')
                    ->table('SOInvDT')
                    ->join('SOInvHD', 'SOInvDT.SOInvID', '=', 'SOInvHD.SOInvID')
                    ->where('SOInvDT.GoodID', $good_id)
                    ->whereIn('SOInvHD.DocuType', [107, 108]); // 107=Credit Sale, 108=Cash Sale
            };

            // Period (ช่วงเวลาที่เลือก)
            $periodStats = $baseQuery()
                ->whereDate('SOInvHD.DocuDate', '>=', $startDate)
                ->whereDate('SOInvHD.DocuDate', '<=', $endDate)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            // Today (ใช้วันที่ end_date)
            $todayStats = $baseQuery()
                ->whereDate('SOInvHD.DocuDate', $endDate)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            // Monthly
            $monthStats = $baseQuery()
                ->whereYear('SOInvHD.DocuDate', $currentYear)
                ->whereMonth('SOInvHD.DocuDate', $currentMonth)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            // Yearly
            $yearStats = $baseQuery()
                ->whereYear('SOInvHD.DocuDate', $currentYear)
                ->select(
                    DB::raw('ISNULL(SUM(GoodStockQty) / 1000.0, 0) as total_ton'),
                    DB::raw('ISNULL(SUM(GoodAmnt), 0) as total_bath'),
                    DB::raw('CASE WHEN SUM(GoodStockQty) > 0 THEN SUM(GoodAmnt) / SUM(GoodStockQty) ELSE 0 END as avg_price')
                )->first();

            return response()->json([
                'status' => 'success',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'good_id' => $good_id,
                'data' => [
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
                        'volume_ton' => round((float)$monthStats->total_ton, 3),
                        'amount_bath' => round((float)$monthStats->total_bath, 2),
                        'avg_price' => round((float)$monthStats->avg_price, 2)
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
