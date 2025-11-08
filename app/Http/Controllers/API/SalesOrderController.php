<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SalesOrderController extends Controller
{
    public function getSalesOrder(Request $request)
    {
        $productId = $request->input('products', 2147);
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $tabName = $request->input('tabName');

        if (!$startDate || !$endDate) {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->toDateString();
        }
        $query = DB::connection('sqlsrv2')
            ->table('SOHD as H')
            ->join('SODT as D', 'H.SOID', '=', 'D.SOID')


            ->leftJoin(DB::raw("(SELECT RefID, SUM(GoodStockQty) AS qty_invoice
                            FROM SOInvDT
                            GROUP BY RefID) as INV"), 'H.SOID', '=', 'INV.RefID')

            ->select(
                'H.SOID',
                'H.DocuNo',
                'H.DocuDate',
                'H.CustName',
                'H.DocuType',
                'H.ShipDate',
                'H.AppvFlag',
                'H.StatusRemark',
                'H.clearflag',
                'D.GoodName',
                'H.ClearSO',

                DB::raw('SUM(D.GoodStockQty) AS qty_order'),
                DB::raw('ISNULL(INV.qty_invoice,0) AS qty_invoice'),
                DB::raw('SUM(D.GoodStockQty) - ISNULL(INV.qty_invoice,0) AS qty_balance'),

                DB::raw('AVG(D.GoodPrice2) AS price'),
                DB::raw('SUM(D.GoodAmnt) AS amount')
            )
            ->where('H.DocuType', 104)
            ->where('H.clearflag', 'N')
            ->where('D.GoodID', $productId)
            ->whereBetween(DB::raw('CAST(H.DocuDate AS DATE)'), [$startDate, $endDate])
            ->groupBy(
                'H.SOID',
                'H.DocuNo',
                'H.DocuDate',
                'H.CustName',
                'H.DocuType',
                'H.ShipDate',
                'H.AppvFlag',
                'H.StatusRemark',
                'H.clearflag',
                'H.ClearSO',
                'D.GoodName',
                'INV.qty_invoice'
            )
            ->orderBy('H.DocuNo', 'DESC')
            ->get();

        return response()->json($query);
    }

    public function getSalesOrderInvoice($docuNo)
    {
        // ✅ 1) ดึง Invoice + Remarks
        $invoice = DB::connection('sqlsrv2')
            ->table('SOInvHD as H')
            ->join('SOInvDT as D', 'H.SOInvID', '=', 'D.SOInvID')
            ->leftJoin('SOInvHDRemark as R3', fn($j) => $j->on('H.SOInvID', '=', 'R3.SOInvID')->where('R3.ListNo', 3))
            ->leftJoin('SOInvHDRemark as R4', fn($j) => $j->on('H.SOInvID', '=', 'R4.SOInvID')->where('R4.ListNo', 4))
            ->leftJoin('SOInvHDRemark as R5', fn($j) => $j->on('H.SOInvID', '=', 'R5.SOInvID')->where('R5.ListNo', 5))
            ->leftJoin('SOInvHDRemark as R6', fn($j) => $j->on('H.SOInvID', '=', 'R6.SOInvID')->where('R6.ListNo', 6))
            ->leftJoin('SOInvHDRemark as R7', fn($j) => $j->on('H.SOInvID', '=', 'R7.SOInvID')->where('R7.ListNo', 7))
            ->select(
                'H.SOInvID',
                'H.SONo',
                'H.DocuNo as InvoiceNo',
                'H.DocuDate',
                'H.CustPONo',
                'D.GoodID',
                'D.GoodName',
                DB::raw('SUM(D.GoodStockQty) as qty'),
                DB::raw('SUM(D.GoodAmnt) as amount'),
                DB::raw('ISNULL(R3.Remark, \'\') as transport_company'), // ← ขนส่ง
                DB::raw('ISNULL(R4.Remark, \'\') as mar_lot'), // ← MAR Lot
                DB::raw('ISNULL(R5.Remark, \'\') as reference_no'), // ← Reference No
                DB::raw('ISNULL(R6.Remark, \'\') as coa_number'), // ← COA Number
                DB::raw('ISNULL(R7.Remark, \'\') as weight_destination') // ← Weight Destination
            )
            ->where('H.SONo', $docuNo)
            ->groupBy(
                'H.SOInvID',
                'H.SONo',
                'H.DocuNo',
                'H.DocuDate',
                'H.CustPONo',
                'D.GoodID',
                'D.GoodName',
                'R3.Remark',
                'R4.Remark',
                'R5.Remark',
                'R6.Remark',
                'R7.Remark'
            )
            ->orderBy('H.DocuDate', 'DESC')
            ->get();

        // ✅ 2) Loop เติมข้อมูล COA & SOPlan
        foreach ($invoice as $row) {
            $lotNumber = trim($row->coa_number); // เลข COA จาก Remark
            $marLot = trim($row->mar_lot);

            // ✅ ดึง COA จาก sqlsrv3
            $coa = DB::connection('sqlsrv3')
                ->table('certificates')
                ->where('coa_number', $lotNumber)
                ->first();

            // ถ้ามีข้อมูล COA
            if ($coa) {
                // ตัด substring ตัวเลขของ lot ออกมาเปรียบเทียบ เช่น MAR681106/005 -> 6811
                $marSub = substr(preg_replace('/[^0-9]/', '', $marLot), 0, 4);
                $coaSub = substr(preg_replace('/[^0-9]/', '', $coa->coa_lot ?? ''), 0, 4);

                // ✅ ถ้าไม่เหมือนกัน → ค้นหา COA ใหม่
                if ($marSub && $coaSub && $marSub !== $coaSub) {
                    $newCoa = DB::connection('sqlsrv3')
                        ->table('certificates')
                        ->where('coa_number', $lotNumber)
                        ->where('coa_lot', 'LIKE', 'QAC' . $marSub . '%')
                        ->first();

                    // ถ้าพบ COA ใหม่ ให้แทนที่
                    if ($newCoa) {
                        $coa = $newCoa;
                    }
                }
            }

            // ✅ กำหนดค่ากลับไปใน object
            $row->coa_sopid     = isset($coa->SOPID) ? (int) $coa->SOPID : null;
            $row->coa_number    = $coa->coa_number ?? null;
            $row->coa_lot       = $coa->coa_lot ?? null;
            $row->coa_tank      = isset($coa->coa_tank) ? (int) $coa->coa_tank : null;

            $row->coa_result_ffa        = isset($coa->result_FFA) ? (float) $coa->result_FFA : null;
            $row->coa_result_moisture   = isset($coa->result_moisture) ? (float) $coa->result_moisture : null;
            $row->coa_result_iv         = isset($coa->result_IV) ? (float) $coa->result_IV : null;
            $row->coa_result_dobi       = isset($coa->result_dobi) ? (float) $coa->result_dobi : null;

            $row->coa_result_shell       = isset($coa->result_shell) ? (float) $coa->result_shell : null;
            $row->coa_result_kn_moisture = isset($coa->result_kn_moisture) ? (float) $coa->result_kn_moisture : null;

            // ✅ 3) ดึงข้อมูลแผนผลิต SOPlan จาก sqlsrv2
            $plan = null;
            if (!empty($row->coa_sopid)) {
                $plan = DB::connection('sqlsrv2')
                    ->table('SOPlan')
                    ->where('SOPID', $row->coa_sopid)
                    ->first();
            }

            $row->plan_no             = $plan->SOPID ?? null;
            $row->plan_date           = $plan->SOPDate ?? null;
            $row->plan_number_car     = $plan->NumberCar ?? null;
            $row->plan_driver_name    = $plan->DriverName ?? null;
            $row->plan_recipient_name = $plan->Recipient ?? null;
            $row->plan_net_weight     = isset($plan->NetWei) ? (float) $plan->NetWei : null;
            $row->plan_status         = $plan->Status ?? null;
        }


        return response()->json($invoice);
    }
}
