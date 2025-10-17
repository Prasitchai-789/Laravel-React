<?php

namespace App\Http\Controllers\Api;

use App\Models\MAR\SOPlan;
use App\Models\WIN\SOInvDT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SaleMARController extends Controller
{
    public function getSalesWeb(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');

            $data = SOPlan::selectRaw('GoodID, SUM(NetWei) as total_goodnet')
                ->whereBetween('SOPDate', [$start_date, $end_date])
                ->groupBy('GoodID')
                ->get();

            return response()->json(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSalesWin(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            // กลุ่มขายสด ขายเชื่อ
            $sales = SOInvDT::selectRaw('GoodID, SUM(GoodAmnt) as total_amount')
                ->whereHas('invoice', function ($query) use ($start_date, $end_date) {
                    $query->whereBetween('DocuDate', [$start_date, $end_date])
                        ->whereIn('DocuType', [107, 108]);
                })
                ->groupBy('GoodID')
                ->get();

            // กลุ่มคืนสินค้า / ลดหนี้
            $returns = SOInvDT::selectRaw('GoodID, SUM(GoodAmnt) as total_amount')
                ->whereHas('invoice', function ($query) use ($start_date, $end_date) {
                    $query->whereBetween('DocuDate', [$start_date, $end_date])
                        ->whereIn('DocuType', [109]);
                })
                ->groupBy('GoodID')
                ->get();

            return response()->json([
                'status' => 'success',
                'sales' => $sales,
                'returns' => $returns
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
