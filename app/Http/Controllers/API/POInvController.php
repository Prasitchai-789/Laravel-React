<?php

namespace App\Http\Controllers\Api;

use App\Models\WIN\POInvDT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

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
}
