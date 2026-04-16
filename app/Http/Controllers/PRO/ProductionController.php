<?php

namespace App\Http\Controllers\PRO;

use App\Http\Controllers\Controller;
use App\Models\PRO\Production;
use App\Models\PRO\FFBCountProduction;
use App\Models\WIN\WebappPOInv;
use App\Exports\PRO\ProductionExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ProductionController extends Controller
{
    // ─── Calculation helpers (same logic as Livewire component) ──────────────

    private function sumShift(array $d): float
    {
        return floatval($d['ShiftA'] ?? 0)
             + floatval($d['ShiftB'] ?? 0)
             + floatval($d['Shift3'] ?? 0)
             + floatval($d['PickupRemain'] ?? 0)
             + floatval($d['RamRemain'] ?? 0);
    }

    private function sumFFB(array $d): float
    {
        $purchase = floatval(str_replace(',', '', $d['FFBPurchase'] ?? 0));
        $forward  = floatval(str_replace(',', '', $d['FFBForward']  ?? 0));
        return $purchase + $forward;
    }

    private function avgPickUp(array $d): float
    {
        $totalFFB = $this->sumFFB($d);
        $sumShift = $this->sumShift($d);
        return $sumShift > 0 ? $totalFFB / $sumShift : 0;
    }

    private function sumFFBGoodQty(array $d): float
    {
        $shiftA   = floatval($d['ShiftA'] ?? 0);
        $shiftB   = floatval($d['ShiftB'] ?? 0);
        $shift3   = floatval($d['Shift3'] ?? 0);
        $avgPickup = $this->avgPickUp($d);
        return ($shiftA + $shiftB + $shift3) * $avgPickup;
    }

    private function sumFFBRemain(array $d): float
    {
        return $this->sumFFB($d) - $this->sumFFBGoodQty($d);
    }

    private function sumPickUpRemain(array $d): float
    {
        $stuckIn  = floatval($d['StuckIn']   ?? 0);
        $steam    = floatval($d['Steam']      ?? 0);
        $forward  = floatval($d['FFBForward'] ?? 0);
        $ffbGood  = $this->sumFFBGoodQty($d);

        return $ffbGood > 0
            ? ($stuckIn + $steam) * $this->avgPickUp($d)
            : $forward;
    }

    private function sumRamRemain(array $d): float
    {
        return $this->sumFFBRemain($d) - $this->sumPickUpRemain($d);
    }

    private function computeAll(array $d): array
    {
        $totalFFB   = $this->sumFFB($d);
        $avgPickup  = $this->avgPickUp($d);
        $ffbGoodQty = $this->sumFFBGoodQty($d);
        $ffbRemain  = $this->sumFFBRemain($d);
        $ramRemain2 = $this->sumRamRemain($d);

        return array_merge($d, [
            'FFBPurchase' => floatval(str_replace(',', '', $d['FFBPurchase'] ?? 0)),
            'FFBForward'  => floatval(str_replace(',', '', $d['FFBForward']  ?? 0)),
            'TotalFFB'    => round($totalFFB,   2),
            'AvgPickup'   => round($avgPickup,  2),
            'FFBGoodQty'  => round($ffbGoodQty, 2),
            'FFBRemain'   => round($ffbRemain,  2),
            'RamRemain2'  => round($ramRemain2, 2),
        ]);
    }

    // ─── Date change API ─────────────────────────────────────────────────────

    /**
     * GET /pro/production-record/date-info?date=YYYY-MM-DD
     * Returns auto-filled values for FFBForward, FFBPurchase, ShiftA/B/3
     */
    public function dateInfo(Request $request): JsonResponse
    {
        $date = $request->input('date', Carbon::now()->subDay()->format('Y-m-d'));

        // FFBForward = FFBRemain ของวันก่อนหน้าก่อนหน้าที่มีข้อมูล
        $prevProd  = Production::where('Date', '<', $date)
            ->whereNotNull('FFBRemain')
            ->orderBy('Date', 'desc')
            ->first();
        $ffbForward = $prevProd ? round($prevProd->FFBRemain, 2) : 0;

        // FFBPurchase = SUM(GoodNet) / 1000 จาก WebappPOInv
        $sumGoodNet = WebappPOInv::whereDate('DocuDate', $date)
            ->selectRaw('SUM(CAST(GoodNet AS DECIMAL(10, 2))) as total')
            ->first()
            ->total ?? 0;
        $ffbPurchase = round($sumGoodNet / 1000, 2);

        return response()->json([
            'FFBForward'  => $ffbForward,
            'FFBPurchase' => $ffbPurchase,
        ]);
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    /**
     * Display the production record list page.
     */
    public function index(Request $request)
    {
        // ── Base filter ──────────────────────────────────────────────
        $baseQuery = Production::query();

        $selectedMonth = $request->filled('month')
            ? Carbon::parse($request->month)
            : Carbon::now();

        $baseQuery->whereMonth('Date', $selectedMonth->month)
                  ->whereYear('Date',  $selectedMonth->year);

        // ── Paginated list ────────────────────────────────────────────
        $productions = (clone $baseQuery)
            ->orderBy('Date', 'desc')
            ->get();

        // ── Monthly aggregate (for KPI cards) ────────────────────────
        $agg = (clone $baseQuery)->selectRaw("
            COUNT(*)                                         AS total_days,
            SUM(ISNULL(TotalFFB,   0))                       AS total_ffb_in,
            SUM(ISNULL(FFBPurchase,0))                       AS total_ffb_purchase,
            SUM(ISNULL(FFBGoodQty, 0))                       AS total_output,
            SUM(ISNULL(ShiftA,0)+ISNULL(ShiftB,0)+ISNULL(Shift3,0)) AS total_truckloads,
            AVG(NULLIF(AvgPickup,  0))                       AS avg_pickup
        ")->first();

        // FFBRemain ของวันที่ล่าสุดใน period
        $latestRecord = (clone $baseQuery)
            ->orderBy('Date', 'desc')
            ->whereNotNull('FFBRemain')
            ->first();
        $lastFFBRemain = $latestRecord ? round((float) $latestRecord->FFBRemain, 2) : 0;

        // FFBForward ของวันแรกในช่วง (= FFBRemain คงค้างก่อนเริ่มเดือน)
        $earliestRecord = (clone $baseQuery)
            ->orderBy('Date', 'asc')
            ->first();
        $firstFFBForward = $earliestRecord ? round((float) ($earliestRecord->FFBForward ?? 0), 2) : 0;

        $totalFFBPurchase = round((float) ($agg->total_ffb_purchase ?? 0), 2);
        $totalFFBIn       = round($totalFFBPurchase + $firstFFBForward, 2);   // 12,732.06 + 334.42 = 13,066.48
        $totalOutput      = round((float) ($agg->total_output      ?? 0), 2);
        $avgYield         = $totalFFBIn > 0 ? round(($totalOutput / $totalFFBIn) * 100, 2) : 0;

        $summary = [
            'month_label'        => $selectedMonth->locale('th')->translatedFormat('F Y'),
            'total_days'         => (int) ($agg->total_days        ?? 0),
            'total_ffb_in'       => $totalFFBIn,
            'total_ffb_purchase' => $totalFFBPurchase,
            'first_ffb_forward'  => $firstFFBForward,
            'total_output'       => $totalOutput,
            'total_truckloads'   => (int) ($agg->total_truckloads  ?? 0),
            'avg_yield'          => $avgYield,
            'avg_pickup'         => round((float)($agg->avg_pickup ?? 0), 2),
            'last_ffb_remain'    => $lastFFBRemain,
        ];

        return Inertia::render('Production/ProductionRecord', [
            'productions' => $productions,
            'summary'     => $summary,
            'filters'     => $request->only(['month']),
        ]);
    }

    /**
     * Store a new production record.
     */
    public function store(Request $request)
    {
        $request->validate([
            'Date'        => 'required|date',
            'FFBForward'  => 'required|numeric',
            'FFBPurchase' => 'required|numeric',
            'ShiftA'      => 'nullable|numeric',
            'ShiftB'      => 'nullable|numeric',
            'Shift3'      => 'nullable|numeric',
            'PickupRemain'=> 'nullable|numeric',
            'RamRemain'   => 'nullable|numeric',
            'Steam'       => 'nullable|numeric',
            'StuckIn'     => 'nullable|numeric',
            'RawFFB'      => 'nullable|numeric',
        ]);

        $data    = $request->all();
        $payload = $this->computeAll($data);

        Production::create($payload);

        return redirect()->route('pro.production.index')
            ->with('success', 'บันทึกข้อมูลการผลิตสำเร็จ');
    }

    /**
     * Update an existing production record.
     */
    public function update(Request $request, $id)
    {
        $production = Production::findOrFail($id);

        $request->validate([
            'Date'        => 'required|date',
            'FFBForward'  => 'required|numeric',
            'FFBPurchase' => 'required|numeric',
            'ShiftA'      => 'nullable|numeric',
            'ShiftB'      => 'nullable|numeric',
            'Shift3'      => 'nullable|numeric',
            'PickupRemain'=> 'nullable|numeric',
            'RamRemain'   => 'nullable|numeric',
            'Steam'       => 'nullable|numeric',
            'StuckIn'     => 'nullable|numeric',
            'RawFFB'      => 'nullable|numeric',
        ]);

        $data    = $request->all();
        $payload = $this->computeAll($data);

        $production->update($payload);

        return redirect()->route('pro.production.index')
            ->with('success', 'อัปเดตข้อมูลการผลิตสำเร็จ');
    }

    /**
     * Delete a production record.
     */
    public function destroy($id)
    {
        Production::findOrFail($id)->delete();

        return redirect()->route('pro.production.index')
            ->with('success', 'ลบข้อมูลการผลิตสำเร็จ');
    }

    /**
     * Export production records for the selected month to Excel.
     * GET /pro/production-record/export?month=YYYY-MM
     */
    public function export(Request $request)
    {
        $month = $request->filled('month')
            ? Carbon::parse($request->month)
            : Carbon::now();

        $label = $month->format('Y-m');

        return Excel::download(
            new ProductionExport($month),
            "production-{$label}.xlsx"
        );
    }
}
