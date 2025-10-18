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




    public function store(Request $request)
    {
        //
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
