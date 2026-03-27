<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\QAC\SkimMixRecord;
use App\Models\QAC\CpoTankInfo;
use App\Models\QAC\CpoDensityRef;
use App\Models\QAC\CPOData;
use Carbon\Carbon;

class SkimMixRecordController extends Controller
{
    /**
     * คำนวณปริมาณ CPO จากระดับน้ำมันและอุณหภูมิ (สูตร Tank No.1)
     */
    private function calculateVolume(float $oilLevel, float $temperature): float
    {
        $tankInfo = CpoTankInfo::where('tank_no', 1)->first();

        if (!$tankInfo) {
            return 0;
        }

        $densityRow = CpoDensityRef::select('temperature_c', 'density')
            ->get()
            ->sortBy(fn($d) => abs($d->temperature_c - $temperature))
            ->first();

        $density = $densityRow->density ?? 0.8841;

        // ปริมาตร 1 cm (m³)
        $volumePerCmM3 = ($tankInfo->volume_m3 / $tankInfo->height_m) / 100;

        // น้ำหนักตัน
        $totalVolume = $oilLevel * $volumePerCmM3 * $density;

        return round($totalVolume, 3);
    }

    /**
     * Sync skim/mix totals + tank1 info ไปที่ cpo_data ของวันนั้น
     */
    private function syncCpoData(string $date)
    {
        $cpoData = CPOData::whereDate('date', $date)->first();
        if (!$cpoData) {
            return; // ไม่มี cpo_data ของวันนี้ ไม่ต้อง sync
        }

        // ดึง records ทั้งหมดของวันนั้น
        $records = SkimMixRecord::whereDate('date', $date)
            ->orderBy('created_at', 'desc')
            ->get();

        // หา record ล่าสุดเพื่ออัพเดท tank1 info
        $latestRecord = $records->first();

        // ผลรวมส่วนต่างของ skim
        $skimTotal = round(
            $records->where('type', 'skim')->sum(fn($r) => floatval($r->difference)),
            3
        );

        // ผลรวมส่วนต่างของ mix (abs เพราะ mix จะเป็นค่าลบ)
        $mixTotal = round(
            abs($records->where('type', 'mix')->sum(fn($r) => floatval($r->difference))),
            3
        );

        $updateData = [
            'skim' => $skimTotal,
            'mix' => $mixTotal,
        ];

        // อัพเดท tank1 info จาก record ล่าสุด
        if ($latestRecord) {
            $updateData['tank1_oil_level'] = $latestRecord->oil_level;
            $updateData['tank1_temperature'] = $latestRecord->temperature;
            $updateData['tank1_cpo_volume'] = $latestRecord->volume;
        }

        $cpoData->update($updateData);
    }

    /**
     * หน้า Index — render Inertia page
     */
    public function index()
    {
        $tankInfo = CpoTankInfo::where('tank_no', 1)->first();
        $densityRef = CpoDensityRef::select('temperature_c', 'density')
            ->orderBy('temperature_c')
            ->get();

        return Inertia::render('QAC/SkimMixRecord', [
            'tankInfo' => $tankInfo,
            'densityRef' => $densityRef,
        ]);
    }

    /**
     * API — ดึงรายการทั้งหมด
     */
    public function apiRecords()
    {
        try {
            $records = SkimMixRecord::orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'records' => $records,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * บันทึกข้อมูล Skim/Mix
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'oil_level' => 'required|numeric|min:0',
            'temperature' => 'required|numeric',
            'type' => 'required|in:skim,mix',
        ]);

        $date = $validated['date'];

        // ตรวจสอบว่ามี cpo_data ของวันก่อนหน้า
        $previousDate = Carbon::parse($date)->subDay()->format('Y-m-d');
        $previousCpoData = CPOData::whereDate('date', $previousDate)->first();

        if (!$previousCpoData) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบข้อมูล CPO ของวันก่อนหน้า (' . Carbon::parse($previousDate)->format('d/m/Y') . ') กรุณาบันทึกข้อมูล CPO วันก่อนหน้าก่อน',
            ], 422);
        }

        $volume = $this->calculateVolume(
            floatval($validated['oil_level']),
            floatval($validated['temperature'])
        );

        // หาปริมาณก่อนหน้าเพื่อคำนวณส่วนต่าง
        // ถ้ายังไม่มี record ของวันนี้ → ใช้ tank1_cpo_volume จาก cpo_data วันก่อนหน้า
        $previousRecord = SkimMixRecord::whereDate('date', $date)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($previousRecord) {
            $previousVolume = floatval($previousRecord->volume);
        } else {
            $previousVolume = floatval($previousCpoData->tank1_cpo_volume ?? 0);
        }

        $difference = round($volume - $previousVolume, 3);

        $record = SkimMixRecord::create([
            'date' => $date,
            'oil_level' => $validated['oil_level'],
            'temperature' => $validated['temperature'],
            'volume' => $volume,
            'difference' => $difference,
            'type' => $validated['type'],
        ]);

        // Sync ไป cpo_data ของวันนี้
        $this->syncCpoData($date);

        return response()->json([
            'success' => true,
            'message' => 'บันทึกข้อมูลสำเร็จ',
            'record' => $record,
        ]);
    }

    /**
     * ลบ record
     */
    public function destroy($id)
    {
        try {
            $record = SkimMixRecord::findOrFail($id);
            $date = $record->date;
            $record->delete();

            // Sync ไป cpo_data หลังลบ
            $this->syncCpoData($date);

            return response()->json([
                'success' => true,
                'message' => 'ลบรายการเรียบร้อยแล้ว',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API — สรุปข้อมูลตามวันที่
     */
    public function apiSummary(Request $request)
    {
        try {
            $date = $request->query('date');
            if (!$date) {
                $date = now()->format('Y-m-d');
            }

            // Records ของวันนั้น
            $records = SkimMixRecord::whereDate('date', $date)
                ->orderBy('created_at', 'desc')
                ->get();

            // ปริมาณล่าสุดของ Tank 1 (record ล่าสุด)
            $latestRecord = $records->first();
            $latestVolume = $latestRecord ? floatval($latestRecord->volume) : 0;
            $totalRecords = $records->count();

            // Skim summary (ผลรวมส่วนต่าง)
            $skimRecords = $records->where('type', 'skim');
            $skimTotal = round($skimRecords->sum(fn($r) => floatval($r->difference)), 3);
            $skimCount = $skimRecords->count();

            // Mix summary (ผลรวมส่วนต่าง)
            $mixRecords = $records->where('type', 'mix');
            $mixTotal = round($mixRecords->sum(fn($r) => floatval($r->difference)), 3);
            $mixCount = $mixRecords->count();

            return response()->json([
                'success' => true,
                'date' => $date,
                'latest_volume' => $latestVolume,
                'total_records' => $totalRecords,
                'skim_total' => $skimTotal,
                'skim_count' => $skimCount,
                'mix_total' => $mixTotal,
                'mix_count' => $mixCount,
                'records' => $records,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * แก้ไข record
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'oil_level' => 'required|numeric|min:0',
            'temperature' => 'required|numeric',
            'type' => 'required|in:skim,mix',
        ]);

        $date = $validated['date'];

        $volume = $this->calculateVolume(
            floatval($validated['oil_level']),
            floatval($validated['temperature'])
        );

        $record = SkimMixRecord::findOrFail($id);

        // หาปริมาณก่อนหน้า (record อื่นที่ไม่ใช่ตัวนี้)
        $previousRecord = SkimMixRecord::whereDate('date', $date)
            ->where('id', '!=', $id)
            ->where('created_at', '<', $record->created_at)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($previousRecord) {
            $previousVolume = floatval($previousRecord->volume);
        } else {
            // ใช้ tank1_cpo_volume จาก cpo_data วันก่อนหน้า
            $previousDate = Carbon::parse($date)->subDay()->format('Y-m-d');
            $previousCpoData = CPOData::whereDate('date', $previousDate)->first();
            $previousVolume = $previousCpoData ? floatval($previousCpoData->tank1_cpo_volume ?? 0) : 0;
        }

        $difference = round($volume - $previousVolume, 3);

        $oldDate = $record->date; // เก็บวันเดิมไว้กรณีเปลี่ยนวัน

        $record->update([
            'date' => $date,
            'oil_level' => $validated['oil_level'],
            'temperature' => $validated['temperature'],
            'volume' => $volume,
            'difference' => $difference,
            'type' => $validated['type'],
        ]);

        // Sync cpo_data ของวันที่ปัจจุบัน
        $this->syncCpoData($date);

        // ถ้าเปลี่ยนวัน ต้อง sync วันเดิมด้วย
        if ($oldDate != $date) {
            $this->syncCpoData($oldDate);
        }

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขข้อมูลสำเร็จ',
            'record' => $record,
        ]);
    }

    /**
     * API — ดึงข้อมูล skim_mix_records สำหรับ prefill หน้า CPO Record
     */
    public function apiPrefillData(Request $request)
    {
        try {
            $date = $request->query('date');
            if (!$date) {
                $date = now()->format('Y-m-d');
            }

            $records = SkimMixRecord::whereDate('date', $date)
                ->orderBy('created_at', 'desc')
                ->get();

            $latestRecord = $records->first();

            $skimTotal = round(
                $records->where('type', 'skim')->sum(fn($r) => floatval($r->difference)),
                3
            );

            $mixTotal = round(
                abs($records->where('type', 'mix')->sum(fn($r) => floatval($r->difference))),
                3
            );

            return response()->json([
                'success' => true,
                'has_data' => $records->count() > 0,
                'tank1_oil_level' => $latestRecord ? floatval($latestRecord->oil_level) : null,
                'tank1_temperature' => $latestRecord ? floatval($latestRecord->temperature) : null,
                'tank1_cpo_volume' => $latestRecord ? floatval($latestRecord->volume) : null,
                'skim_total' => $skimTotal,
                'mix_total' => $mixTotal,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
