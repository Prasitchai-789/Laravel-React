<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class DailyBarCharController extends Controller
{
    public function index(Request $request)
    {
        $items = DB::connection('sqlsrv2')
            ->table('dbo.POInvHD as h')
            ->join('dbo.POInvDT as d', 'h.POInvID', '=', 'd.POInvID')
            ->select(
                DB::raw('YEAR(h.DocuDate) as Year'),
                DB::raw('MONTH(h.DocuDate) as Month'),
                DB::raw('DAY(h.DocuDate) as Day'),
                DB::raw('SUM(d.GoodQty2) as TotalQty')
            )
            ->where('d.GoodID', 2156)
            ->groupByRaw('YEAR(h.DocuDate), MONTH(h.DocuDate), DAY(h.DocuDate)')
            ->orderByRaw('YEAR(h.DocuDate), MONTH(h.DocuDate), DAY(h.DocuDate)')
            ->get();
        return Inertia::render('RPO/DailyBarChar', [
            'dailyData' => $items,
        ]);
    }
}
