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
                        ->whereIn('Docutype', [107, 108]);
                })
                ->groupBy('GoodID')
                ->get();

            // กลุ่มคืนสินค้า / ลดหนี้
            $returns = SOInvDT::selectRaw('GoodID, SUM(GoodAmnt) as total_amount')
                ->whereHas('invoice', function ($query) use ($start_date, $end_date) {
                    $query->whereBetween('DocuDate', [$start_date, $end_date])
                        ->whereIn('Docutype', [109]);
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

    public function getSalesSummary(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            $good_id = $request->good_id ?? 2147;

            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            // ✅ ฟังก์ชันย่อยสำหรับยอดขาย/ลดหนี้
            $buildSalesQuery = function ($types) use ($start_date, $end_date, $good_id) {
                return SOInvDT::selectRaw('
                    SOInvDT.GoodID,
                    YEAR(invoice.DocuDate) as year,
                    MONTH(invoice.DocuDate) as month,
                    SUM(SOInvDT.GoodAmnt) as total_amount
                ')
                    ->join('SOInvHD as invoice', 'SOInvDT.SOInvID', '=', 'invoice.SOInvID')
                    ->whereBetween('invoice.DocuDate', [$start_date, $end_date])
                    ->whereIn('invoice.Docutype', $types)
                    ->when($good_id, fn($q) => $q->where('SOInvDT.GoodID', $good_id))
                    ->groupBy(
                        'SOInvDT.GoodID',
                        DB::raw('YEAR(invoice.DocuDate)'),
                        DB::raw('MONTH(invoice.DocuDate)')
                    )
                    ->orderBy(DB::raw('YEAR(invoice.DocuDate)'))
                    ->orderBy(DB::raw('MONTH(invoice.DocuDate)'))
                    ->get();
            };

            // ✅ ฟังก์ชันย่อยสำหรับน้ำหนัก
            $buildWeightQuery = function () use ($start_date, $end_date, $good_id) {
                return SOPlan::selectRaw('
                    SOPlan.GoodID,
                    YEAR(SOPDate) as year,
                    MONTH(SOPDate) as month,
                    SUM(NetWei) as total_weight
                ')
                    ->whereBetween('SOPDate', [$start_date, $end_date])
                    ->when($good_id, fn($q) => $q->where('GoodID', $good_id))
                    ->groupBy(
                        'SOPlan.GoodID',
                        DB::raw('YEAR(SOPDate)'),
                        DB::raw('MONTH(SOPDate)')
                    )
                    ->orderBy(DB::raw('YEAR(SOPDate)'))
                    ->orderBy(DB::raw('MONTH(SOPDate)'))
                    ->get();
            };

            // ✅ ดึงข้อมูลแต่ละส่วน
            $sales = $buildSalesQuery([107, 108]);
            $returns = $buildSalesQuery([109]);
            $weights = $buildWeightQuery();

            // ✅ จัดรูปแบบข้อมูลให้ง่ายต่อ frontend
            $grouped = [
                'sales' => $sales->groupBy('GoodID')->map(fn($items) => $items->map(fn($i) => [
                    'year' => $i->year,
                    'month' => $i->month,
                    'total_amount' => $i->total_amount,
                ])->values()),
                'returns' => $returns->groupBy('GoodID')->map(fn($items) => $items->map(fn($i) => [
                    'year' => $i->year,
                    'month' => $i->month,
                    'total_amount' => $i->total_amount,
                ])->values()),
                'weights' => $weights->groupBy('GoodID')->map(fn($items) => $items->map(fn($i) => [
                    'year' => $i->year,
                    'month' => $i->month,
                    'total_weight' => $i->total_weight,
                ])->values()),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $grouped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
