<?php

namespace App\Http\Controllers\PRO;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\PRO\Production;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\PRO\FFBCountProduction;

class ProductionReportController extends Controller
{
    public function index(Request $request)
    {
        $dateStr = $request->get('date', Carbon::now()->subDay()->format('Y-m-d'));
        $date = Carbon::parse($dateStr);
        $monthStr = $date->format('Y-m');

        // ข้อมูล Production ของวันนั้น
        $production = Production::whereDate('Date', $date->format('Y-m-d'))->first();
        $cs = null; // Removed ffb_count_productions query since the table doesn't exist

        // คำนวณยอดรวมรายเดือน ตามที่ ReportProLive เคยทำ
        // Query ตั้งแต่วันที่ 1 ของเดือน จนถึง $date
        $startDate = $date->copy()->startOfMonth()->format('Y-m-d');
        $endDate = $date->format('Y-m-d');

        // หายอดรวม
        $monthlySums = Production::whereBetween('Date', [$startDate, $endDate])
            ->selectRaw('
                SUM(CAST(FFBGoodQty AS FLOAT)) as total_ffb_good_qty,
                SUM(CAST(ShiftA AS FLOAT)) as total_shift_a,
                SUM(CAST(ShiftB AS FLOAT)) as total_shift_b,
                SUM(CAST(Shift3 AS FLOAT)) as total_shift_3
            ')
            ->first();

        // ของทั้งหมดทั้งเดือน
        $totalShiftAll = ($monthlySums->total_shift_a ?? 0) + ($monthlySums->total_shift_b ?? 0) + ($monthlySums->total_shift_3 ?? 0);
        
        $avgMonth = $totalShiftAll > 0 
            ? Production::whereBetween('Date', [$startDate, $endDate])
                ->selectRaw('SUM(CAST(FFBForward AS FLOAT) + CAST(FFBPurchase AS FLOAT)) / nullif(SUM(CAST(ShiftA AS FLOAT) + CAST(ShiftB AS FLOAT) + CAST(Shift3 AS FLOAT) + CAST(PickupRemain AS FLOAT) + CAST(RamRemain AS FLOAT)), 0) as avg_month')
                ->first()->avg_month ?? 0 
            : 0;

        // หา Max ของทั้งระบบเพื่อเป็น maxValue (100% สำหรับ Chart) และวันที่
        $maxRecord = Production::orderBy(DB::raw('CAST(FFBGoodQty AS FLOAT)'), 'desc')->first();
        $maxValue = $maxRecord ? (float) $maxRecord->FFBGoodQty : 1;
        $maxDate = $maxRecord ? $maxRecord->Date : null;

        // ดึงกราฟ Month
        $chartRecords = Production::whereBetween('Date', [$startDate, $endDate])
            ->orderBy('Date', 'asc')
            ->select('Date', 'FFBGoodQty')
            ->get();
            
        $chartData = $chartRecords->map(function($record) {
            return (float) $record->FFBGoodQty;
        })->toArray();
        $chartLabels = $chartRecords->pluck('Date')->toArray();

        // เพื่อให้ตรงกับโครงสร้างหน้าบ้าน
        return Inertia::render('Production/ProductionReport', [
            'date' => $date->format('Y-m-d'),
            'production' => $production,
            'cs' => [
                'CS1' => $production->CS1 ?? null,
                'CS2' => $production->CS2 ?? null,
            ],
            'summary' => [
                'total_ffb_good_qty' => (float)($monthlySums->total_ffb_good_qty ?? 0),
                'total_shift_a' => (float)($monthlySums->total_shift_a ?? 0),
                'total_shift_b' => (float)($monthlySums->total_shift_b ?? 0),
                'total_shift_3' => (float)($monthlySums->total_shift_3 ?? 0),
                'total_shift_all' => $totalShiftAll,
                'avgPickupMonth' => (float)$avgMonth,
                'maxValue' => (float)$maxValue,
                'maxDate' => $maxDate,
            ],
            'chart' => [
                'labels' => $chartLabels,
                'values' => $chartData
            ]
        ]);
    }
}
