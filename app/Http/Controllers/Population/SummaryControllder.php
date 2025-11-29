<?php

namespace App\Http\Controllers\Population;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SummaryControllder extends Controller
{
   public function getProvinceSakon()
{
    $data = DB::connection('sqlsrv2')
        ->table('Webapp_City')
        ->select(
            DB::raw("LTRIM(RTRIM(ProvinceName)) as ProvinceName"),
            DB::raw("LTRIM(RTRIM(DistrictName)) as DistrictName"),
            DB::raw("LTRIM(RTRIM(SubDistrictName)) as SubDistrictName")
        )
        ->where('ProvinceName', 'สกลนคร') // หรือใช้ LTRIM/RTRIM
        ->distinct()
        ->orderBy('ProvinceName')
        ->orderBy('DistrictName')
        ->orderBy('SubDistrictName')
        ->get();

    return response()->json($data);
}





}
