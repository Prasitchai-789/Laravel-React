<?php

namespace App\Http\Controllers\Api;

use Inertia\Inertia;
use App\Models\WIN\POHD;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Http\Resources\PurchaseDashboardResource;

class PurchaseDashboardController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Dashboard/Purchase/Index', []);
    }

    public function apiIndex(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', null); // null = ทั้งปี
        $deptId = $request->input('dept_id', null); // null = ทุกฝ่าย
        $onhold = $request->input('OnHold', 'N'); // ค่า default ตามที่ต้องการ
        $cancelflag = $request->input('CancelFlag', 'N');

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
            ->whereNotNull('POHD.RefDocuNo')
            ->where('POHD.DocuType', 305);
        // กรองเดือน ถ้า user เลือก
        if ($month) {
            $query->whereMonth('POHD.DocuDate', $month);
        }

        // กรองฝ่าย ถ้า user เลือก
        if ($deptId) {
            $query->where('POHD.DeptID', $deptId);
        }

        $data = $query
            ->groupBy('POHD.DeptID', 'EMDept.DeptName')
            ->orderBy('EMDept.DeptName', 'asc')
            ->get();

        return response()->json(['dashboard' => $data]);
    }

    public function apiPOinvReport(Request $request)
    {
        $branchId = $request->input('brchid', 0);
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', null); // null = ทั้งปี

        // Query หลัก
        $query = DB::connection('sqlsrv2')
            ->table('POInvHD') // แก้ชื่อ table
            ->leftJoin('POInvDT', 'POInvHD.POInvID', '=', 'POInvDT.POInvID')
            ->leftJoin('EMGoodUnit', 'POInvDT.GoodUnitID2', '=', 'EMGoodUnit.GoodUnitID')
            ->leftJoin('EMVendor', 'POInvHD.VendorID', '=', 'EMVendor.VendorID')
            ->leftJoin('EMDept', 'POInvHD.DeptID', '=', 'EMDept.DeptID')
            ->leftJoin('EMGood', 'POInvDT.GoodID', '=', 'EMGood.GoodID')
            ->leftJoin('EMJob', 'POInvDT.JobID', '=', 'EMJob.JobID')
            ->leftJoin('EMInve', 'POInvDT.InveID', '=', 'EMInve.InveID')
            ->leftJoin('EMTransp', 'POInvHD.TranspID', '=', 'EMTransp.TranspID')
            ->leftJoin('EMGoodType', 'EMGood.GoodTypeID', '=', 'EMGoodType.GoodTypeID')
            ->leftJoin('EMGoodGroup', 'EMGood.GoodGroupID', '=', 'EMGoodGroup.GoodGroupID')
            ->leftJoin('EMGoodSize', 'EMGood.GoodSizeID', '=', 'EMGoodSize.GoodSizeID')
            ->leftJoin('EMGoodCate', 'EMGood.GoodCateID', '=', 'EMGoodCate.GoodCateID')
            ->select([
                'POInvHD.DocuDate',
                'POInvHD.DocuNo',
                'POInvHD.InvNo',
                'POInvHD.InvDate',
                'POInvHD.PONo',
                'POInvHD.ShipNo',
                'POInvHD.ShipDate',
                'POInvHD.SumGoodAmnt',
                'POInvHD.BrchID',
                'POInvHD.BillDiscFormula',
                'POInvHD.BillDiscAmnt',
                'POInvHD.AdvnAmnt',
                'POInvHD.VATAmnt',
                'POInvHD.NetAmnt',
                'POInvHD.POInvID',
                'POInvHD.TotaBaseAmnt',
                'POInvHD.AftrAdvnAmnt',
                'POInvHD.BillAftrDiscAmnt',
                'POInvDT.ListNo',
                'POInvDT.GoodID',
                'POInvDT.GoodName',
                'POInvDT.GoodQty2',
                'POInvDT.GoodStockQty',
                'POInvDT.GoodPrice2',
                'POInvDT.GoodDiscFormula',
                'POInvDT.GoodDiscAmnt',
                DB::raw("
                    CASE
                        WHEN ISNULL(POInvHD.ReceNo, '') <> '' THEN POInvHD.ReceNo
                        WHEN ISNULL(POInvHD.PONo, '') <> '' THEN POInvHD.PONo
                        ELSE ' '
                    END AS CF_RefNo
                "),
                'POInvDT.GoodAmnt',
                'EMVendor.VendorCode',
                DB::raw("
                    CASE
                        WHEN EMVendor.VendorTitle IS NULL OR EMVendor.VendorTitle = ''
                        THEN ISNULL(EMVendor.VendorName, '')
                        ELSE EMVendor.VendorTitle + ' ' + ISNULL(EMVendor.VendorName, '')
                    END AS VendorName
                "),
                'EMVendor.VendorNameEng',
                'EMDept.DeptCode',
                'EMDept.DeptNameEng',
                'EMGood.GoodCode',
                'EMGood.GoodNameEng1 AS GoodNameEng',
                'EMGoodUnit.GoodUnitNameEng',
                'POInvHD.JobID',
                'EMJob.JobName',
                'EMJob.JobNameEng',
                'EMJob.JobCode',
                'POInvHD.CrdtDays',
                DB::raw("ISNULL(POInvDT.PONo, '') AS ApprovePO"),
                'EMGoodType.GoodTypeCode',
                'EMGoodType.GoodTypeName',
                'EMGoodType.GoodTypeNameEng',
                'EMGoodSize.GoodSizeCode',
                'EMGoodSize.GoodSizeName',
                'EMGoodSize.GoodSizeNameEng'
            ])
            ->where('POInvHD.DocuType', 309)
            ->where('POInvHD.MultiCurr', 'N');

        // เงื่อนไขสาขา
        if ($branchId != 0) {
            $query->where('POInvHD.BrchID', $branchId);
        }

        // เงื่อนไขปีและเดือน
        $query->whereYear('POInvHD.DocuDate', $year);
        if ($month) {
            $query->whereMonth('POInvHD.DocuDate', $month);
        }

        $data = $query->get();

        return response()->json([
            'status' => 'success',
            'count' => $data->count(),
            'data' => $data
        ]);
    }

    public function apiPOinvSummary(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', null); // null = ทั้งปี
        $branchId = $request->input('brchid', null); // null = ทุกสาขา
        $deptId = $request->input('dept_id', null); // null = ทุกฝ่าย

        $query = DB::connection('sqlsrv2')
            ->table('POInvHD')
            ->join('POInvDT', 'POInvHD.POInvID', '=', 'POInvDT.POInvID')
            ->join('EMDept', 'POInvHD.DeptID', '=', 'EMDept.DeptID')
            ->select(
                'POInvHD.DeptID',
                'EMDept.DeptName',
                DB::raw('SUM(POInvHD.TotaBaseAmnt) as TotalBase'),
                DB::raw('SUM(POInvHD.NetAmnt) as TotalNet')
            )
            ->where('POInvHD.DocuType', 309)
            ->where('POInvHD.MultiCurr', 'N');

        // กรองสาขา
        if ($branchId) {
            $query->where('POInvHD.BrchID', $branchId);
        }

        // กรองฝ่าย
        if ($deptId) {
            $query->where('POInvHD.DeptID', $deptId);
        }

        // กรองปี
        $query->whereYear('POInvHD.DocuDate', $year);

        // กรองเดือน ถ้า user เลือก
        if ($month) {
            $query->whereMonth('POInvHD.DocuDate', $month);
        }

        $data = $query
            ->groupBy('POInvHD.DeptID', 'EMDept.DeptName')
            ->orderBy('EMDept.DeptName', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'dashboard' => $data
        ]);
    }

    public function apiPOinvByDept(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', null); // null = ทั้งปี
        $branchId = $request->input('brchid', null); // กรองสาขา (ถ้ามี)

        $query = DB::connection('sqlsrv2')
            ->table('POInvHD')
            ->join('EMDept', 'POInvHD.DeptID', '=', 'EMDept.DeptID')
            ->select(
                'POInvHD.DeptID',
                'EMDept.DeptName',
                DB::raw('SUM(POInvHD.TotaBaseAmnt) as TotalBase'),
                DB::raw('SUM(POInvHD.BillDiscAmnt) as TotalBillDiscount'),
                DB::raw('SUM(POInvHD.AdvnAmnt) as TotalAdvance'),
                DB::raw('SUM(POInvHD.NetAmnt) as TotalNet'),
                DB::raw('SUM(POInvHD.VATAmnt) as TotalVAT')
            )
            ->where('POInvHD.DocuType', 309) // กรองเฉพาะเอกสารประเภทนี้
            ->where('POInvHD.MultiCurr', 'N') // เงื่อนไขเงินสกุลเดียว
            ->whereYear('POInvHD.DocuDate', $year);

        // กรองเดือนถ้ามี
        if ($month) {
            $query->whereMonth('POInvHD.DocuDate', $month);
        }

        // กรองสาขาถ้ามี
        if ($branchId) {
            $query->where('POInvHD.BrchID', $branchId);
        }

        // group by แผนก
        $data = $query
            ->groupBy('POInvHD.DeptID', 'EMDept.DeptName')
            ->orderBy('EMDept.DeptName')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }






    public function show(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
