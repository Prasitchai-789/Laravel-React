<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SalesOrderController extends Controller
{
    public function getSalesOrder(Request $request)
    {
        $query = DB::connection('sqlsrv2')
            ->table('SOHD as H')
            ->join('SODT as D', 'H.SOID', '=', 'D.SOID')

            // ✅ Subquery ปริมาณออกใบเสร็จ ไม่ทำให้ duplicate
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
            ->where('D.GoodID', 2147)
            ->where('H.DocuType', 104)
            ->where('H.clearflag', 'N')
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
                DB::raw('ISNULL(R3.Remark, \'\') as transport_company'),
                DB::raw('ISNULL(R4.Remark, \'\') as reference_no'),
                DB::raw('ISNULL(R5.Remark, \'\') as weight_destination'),
                DB::raw('ISNULL(R6.Remark, \'\') as coa_number')
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
                'R6.Remark'
            )
            ->orderBy('H.DocuDate', 'DESC')
            ->get();

        // ✅ 2) Loop เติมข้อมูล COA & SOPlan
        foreach ($invoice as $row) {

            $lot = trim($row->coa_number); // ← Lot/COA number from remark

            // ✅ ดึง COA จาก sqlsrv3
            $coa = DB::connection('sqlsrv3')
                ->table('certificates')
                ->where('coa_lot', $lot)     // หรือ coa_number ถ้า remark เป็นเลข COA
                ->orWhere('coa_number', $lot)
                ->first();

            $row->coa_sopid     = $coa->SOPID     ?? '';
            $row->coa_number    = $coa->coa_number ?? '';
            $row->coa_lot       = $coa->coa_lot    ?? '';
            $row->coa_tank      = $coa->coa_tank   ?? '';
            $row->coa_result_ffa = $coa->result_FFA ?? '';
            $row->coa_result_moisture = $coa->result_moisture ?? '';
            $row->coa_result_iv  = $coa->result_IV  ?? '';
            $row->coa_result_dobi = $coa->result_dobi ?? '';
            $row->coa_result_shell = $coa->result_shell ?? '';
            $row->coa_result_kn_moisture = $coa->result_kn_moisture ?? '';

            // ✅ 3) ดึงข้อมูลแผนผลิต SOPlan จาก sqlsrv2
            if (!empty($row->coa_sopid)) {
                $plan = DB::connection('sqlsrv2')
                    ->table('SOPlan')
                    ->where('SOPID', $row->coa_sopid)
                    ->first();
            } else {
                $plan = null;
            }

            $row->plan_no        = $plan->SOPID ?? '';
            $row->plan_date      = $plan->SOPDate ?? '';
            $row->plan_number_car       = $plan->NumberCar  ?? '';
            $row->plan_driver_name    = $plan->DriverName ?? '';
            $row->plan_recipient_name = $plan->Recipient ?? '';
            $row->plan_net_weight = $plan->NetWei ?? '';
            $row->plan_status = $plan->Status ?? '';
        }

        return response()->json($invoice);
    }
}
