<?php

namespace App\Http\Controllers\RPO;

use App\Models\User;
use Inertia\Inertia;
use App\Models\WIN\POInvHD;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class PurchaseSummaryController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'good_ids' => 'array',
            'good_ids.*' => 'integer',
            'province' => 'nullable|string',
        ]);
        $cacheKey = 'purchases.summary:' . md5(json_encode($validated));
        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($validated) {
            $q = DB::table('vw_PalmPurchases')
                ->select('Province', DB::raw('SUM(GoodAmnt) AS total_amount'))
                ->whereBetween('DocDate', [$validated['start_date'], $validated['end_date']]);


            if (!empty($validated['good_ids'])) {
                $q->whereIn('GoodID', $validated['good_ids']);
            }
            if (!empty($validated['province'])) {
                $q->where('Province', $validated['province']);
            }


            $rows = $q->groupBy('Province')
                ->orderByDesc(DB::raw('SUM(GoodAmnt)'))
                ->get();


            $total = $rows->sum('total_amount');
            $users = User::all();
            return Inertia::render('RPO/Index', [
                'data' => $users,
                'total' => $total,
                'items' => $rows,
            ]);

            // return response()->json([]);
        });
    }

    public function summary(Request $request)
    {
        $start = $request->query('start_date', '2025-07-01'); // ถ้าไม่มีค่า default = '2025-07-01'
        $end   = $request->query('end_date', '2025-07-31');

        $POInvHD = POInvHD::with(['details' => function ($query) {
            $query->where('GoodID', 2156)   // filter details ที่ GoodID = 2156
                ->with('good');           // eager load relation good
        }, 'vendor'])
            ->whereBetween('DocuDate', [$start, $end])
            ->whereHas('details', function ($query) {
                $query->where('GoodID', 2156);  // ต้องมี details ที่ GoodID = 2156
            })
            ->get();

        $items = DB::connection('sqlsrv2')
            ->table('POInvHD as h')
            ->join('POInvDT as d', 'h.POInvID', '=', 'd.POInvID')
            ->join('EMVendor as v', 'h.VendorID', '=', 'v.VendorID')
            ->join('EMGood as g', 'd.GoodID', '=', 'g.GoodID')
            ->select(
        DB::raw("LTRIM(RTRIM(REPLACE(REPLACE(v.Province, 'จ.', ''), 'จังหวัด', ''))) as Province"),
                 DB::raw('COUNT(DISTINCT v.VendorID) as VendorCount'),
                 DB::raw('SUM(d.GoodQty2) as TotalQty')
            )
            ->where('d.GoodID', 2156)
            ->whereBetween('h.DocuDate', [$start, $end])
            ->groupByRaw("LTRIM(RTRIM(REPLACE(REPLACE(v.Province, 'จ.', ''), 'จังหวัด', '')))")
            ->orderByDesc('TotalQty')
            ->get();

        $total = $items->sum('TotalQty');

        return Inertia::render('RPO/Index', [
            'startDate' => $start,
            'endDate'   => $end,
            'total'     => $total,
            'items'     => $items,
        ]);
    }


    // รายเดือน
    public function monthly(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');

        $items = DB::table('vw_PalmPurchases')
            ->select(DB::raw("DATE_FORMAT(DocDate, '%Y-%m-01') as DocMonthStart"), DB::raw('SUM(LineTotal) as total_amount'))
            ->when($start, fn($q) => $q->whereDate('DocDate', '>=', $start))
            ->when($end, fn($q) => $q->whereDate('DocDate', '<=', $end))
            ->groupBy('DocMonthStart')
            ->orderBy('DocMonthStart')
            ->get();

        return response()->json([
            'items' => $items,
        ]);
    }

    // Stacked: จังหวัด × สินค้า
    public function provinceGood(Request $request)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date');

        $raw = DB::table('vw_PalmPurchases')
            ->select('Province', 'GoodName', DB::raw('SUM(LineTotal) as total_amount'))
            ->when($start, fn($q) => $q->whereDate('DocDate', '>=', $start))
            ->when($end, fn($q) => $q->whereDate('DocDate', '<=', $end))
            ->groupBy('Province', 'GoodName')
            ->get();

        $categories = $raw->pluck('Province')->unique()->values()->all();
        $goods = $raw->pluck('GoodName')->unique();

        $series = $goods->map(function ($g) use ($raw, $categories) {
            return [
                'name' => $g,
                'data' => collect($categories)->map(function ($prov) use ($g, $raw) {
                    return (float) ($raw->firstWhere(fn($r) => $r->Province === $prov && $r->GoodName === $g)->total_amount ?? 0);
                })->all()
            ];
        })->values();

        return response()->json([
            'categories' => $categories,
            'series' => $series,
        ]);
    }
}
