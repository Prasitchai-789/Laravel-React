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
    $month = $request->input('month', date('m'));

    $query = POHD::on('sqlsrv2')
        ->join('PODT', 'POHD.POID', '=', 'PODT.POID')
        ->join('dbo.EMDept', 'POHD.DeptID', '=', 'EMDept.DeptID')
        ->select(
            'POHD.DeptID',
            'EMDept.DeptName',
            DB::raw('SUM(POHD.TotabaseAmnt) as TotalBase'),
            DB::raw('SUM(POHD.VATAmnt) as TotalVAT'),
            DB::raw('SUM(POHD.NetAmnt) as TotalNet')
        )
        ->whereYear('POHD.DocuDate', $year);

    if ($month != 0) { // 0 = ทั้งหมด
        $query->whereMonth('POHD.DocuDate', $month);
    }

    $data = $query
        ->groupBy('POHD.DeptID', 'EMDept.DeptName')
        ->get();

    return response()->json(['dashboard' => $data]);
}


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
