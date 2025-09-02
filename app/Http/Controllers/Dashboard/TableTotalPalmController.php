<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use App\Models\WIN\POInvHD;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class TableTotalPalmController extends Controller
{
    public function index()
    {
        $items = DB::connection('sqlsrv2')
            ->table('dbo.POInvHD as h')
            ->join('dbo.POInvDT as d', 'h.POInvID', '=', 'd.POInvID')
            ->select(
                DB::raw('YEAR(h.DocuDate) as Year'),
                DB::raw('MONTH(h.DocuDate) as Month'),
                DB::raw('SUM(d.GoodQty2) as TotalQty')
            )
            ->where('d.GoodID', 2156)
            ->groupByRaw('YEAR(h.DocuDate), MONTH(h.DocuDate)')
            ->orderByRaw('YEAR(h.DocuDate), MONTH(h.DocuDate)')
            ->get();

        $pivot = [];
        $years = $items->pluck('Year')->unique()->sort()->values()->all();

        $monthNames = [
            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December'
        ];

        // query data
        foreach ($items as $item) {
            $month = $monthNames[$item->Month];
            $year = $item->Year;
            $pivot[$month][$year] = $item->TotalQty;
        }

        // manual data
        $manualData2020 = [
            1 => 178347,
            2 => 819500,
            3 => 1756570,
            4 => 15762430,
            5 => 18820110,
            6 => 18595290,
            7 => 15028580,
            8 => 17140780,
            9 => 14391740,
            10 => 8902850,
            11 => 2486050,
            12 => 2715660
        ];

        $manualData2021 = [
            1 => 2662670,
            2 => 2834180,
            3 => 12332920,
            4 => 18614350,
            5 => 20509670,
            6 => 18280820,
            7 => 20316810,
            8 => 23253700,
            9 => 22987040,
            10 => 17393480,
            11 => 8911810,
            12 => 40980
        ];


        $manualData2022 = [
            1 => 0,
            2 => 9286040,
            3 => 18936560,
            4 => 24129010,
            5 => 21708370,
            6 => 16881980,
            7 => 13478460,
            8 => 20292820,
            9 => 25889940,
            10 => 16061950,
            11 => 5144570,
            12 => 5306580
        ];

        // เพิ่มปี manual เข้าไปใน pivot
        foreach ($manualData2020 as $m => $val) {
            $month = $monthNames[$m];
            $pivot[$month][2020] = $val;
        }
        foreach ($manualData2021 as $m => $val) {
            $month = $monthNames[$m];
            $pivot[$month][2021] = $val;
        }
        foreach ($manualData2022 as $m => $val) {
            $month = $monthNames[$m];
            $pivot[$month][2022] = $val;
        }


        // รวมปี manual เข้าไปใน years
        $years = collect($years)
            ->merge([2020, 2021, 2022])
            ->unique()
            ->sort()
            ->values()
            ->all();

        // เติม 0 ถ้าไม่มีข้อมูล
        foreach ($monthNames as $mName) {
            foreach ($years as $y) {
                if (!isset($pivot[$mName][$y])) {
                    $pivot[$mName][$y] = 0;
                }
            }
        }

        // ผลรวม
        $totals = [];
        foreach ($years as $y) {
            $totals[$y] = collect($pivot)->sum(fn($row) => $row[$y]);
        }

        return Inertia::render('RPO/TableTotalPalm', [
            'pivot' => $pivot,
            'years' => $years,
            'totals' => $totals,
        ]);
    }
}
