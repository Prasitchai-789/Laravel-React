<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use App\Models\QAC\CPOData;
use App\Models\QAC\CpoTank;
use Illuminate\Http\Request;
use App\Models\QAC\CpoRecord;
use App\Models\QAC\CpoOilRoom;
use App\Models\QAC\CpoTankInfo;
use App\Models\QAC\StockProduct;
use App\Models\QAC\CpoDensityRef;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class CPORecordController extends Controller
{
    public function index()
    {
        $cpoTankInfo = CpoTankInfo::select('tank_no', 'height_m', 'diameter_m', 'volume_m3')->get();
        $cpoDensityRef = CpoDensityRef::select('temperature_c', 'density')->get();
        return Inertia::render('QAC/CPOIndex', [
            'cpoTankInfo' => $cpoTankInfo,
            'cpoDensityRef' => $cpoDensityRef
        ]);
    }
    private function calculateCPOVolume($tankData)
    {
        // ดึงข้อมูลถังจากฐานข้อมูล
        $cpoTankInfo = CpoTankInfo::select('tank_no', 'height_m', 'diameter_m', 'volume_m3')
            ->get()
            ->keyBy('tank_no');

        // ดึงข้อมูลความหนาแน่นจากฐานข้อมูล
        $cpoDensityRef = CpoDensityRef::select('temperature_c', 'density')
            ->get()
            ->keyBy('temperature_c');

        $totalCPO = 0;
        $calculatedVolumes = [];

        foreach ($tankData as $tankIndex => $tank) {
            $tankNo = $tankIndex + 1; // 0 => Tank 1, 1 => Tank 2, etc.

            // ตรวจสอบว่ามีข้อมูลระดับน้ำมันและอุณหภูมิหรือไม่
            if (
                !isset($tank['oil_level']) || !isset($tank['temperature']) ||
                $tank['oil_level'] === null || $tank['temperature'] === null
            ) {
                $calculatedVolumes[$tankNo] = 0;
                continue;
            }

            $oilLevel = $tank['oil_level']; // ระดับน้ำมัน (cm)
            $temperature = $tank['temperature']; // อุณหภูมิ (°C)

            // ดึงข้อมูลถัง
            $tankInfo = $cpoTankInfo->get($tankNo);
            if (!$tankInfo) {
                $calculatedVolumes[$tankNo] = 0;
                continue;
            }

            // หาความหนาแน่นจากอุณหภูมิ
            $densityData = $cpoDensityRef->get($temperature);
            $density = $densityData ? $densityData->density : 0.8841; // ค่า default

            // คำนวณปริมาณต่อ cm
            // สูตร: (volume_m3 * density) / (height_m * 100)
            $volumePerCm = ($tankInfo->volume_m3 * $density) / ($tankInfo->height_m * 100);

            // คำนวณปริมาณทั้งหมด
            // สูตร: ระดับน้ำมัน (cm) * ปริมาณต่อ cm
            $totalVolume = $oilLevel * $volumePerCm;

            $calculatedVolumes[$tankNo] = $totalVolume;
            $totalCPO += $totalVolume;
        }

        return [
            'volumes' => $calculatedVolumes,
            'total_cpo' => $totalCPO
        ];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',

            // Tank 1 validation
            'tanks.0.oil_level' => 'nullable|numeric',
            'tanks.0.temperature' => 'nullable|numeric',
            'tanks.0.cpo_volume' => 'nullable|numeric',
            'tanks.0.ffa' => 'nullable|numeric',
            'tanks.0.moisture' => 'nullable|numeric',
            'tanks.0.dobi' => 'nullable|numeric',

            // Tank 2 validation
            'tanks.1.oil_level' => 'nullable|numeric',
            'tanks.1.temperature' => 'nullable|numeric',
            'tanks.1.cpo_volume' => 'nullable|numeric',
            'tanks.1.top_ffa' => 'nullable|numeric',
            'tanks.1.top_moisture' => 'nullable|numeric',
            'tanks.1.top_dobi' => 'nullable|numeric',
            'tanks.1.bottom_ffa' => 'nullable|numeric',
            'tanks.1.bottom_moisture' => 'nullable|numeric',
            'tanks.1.bottom_dobi' => 'nullable|numeric',

            // Tank 3 validation
            'tanks.2.oil_level' => 'nullable|numeric',
            'tanks.2.temperature' => 'nullable|numeric',
            'tanks.2.cpo_volume' => 'nullable|numeric',
            'tanks.2.top_ffa' => 'nullable|numeric',
            'tanks.2.top_moisture' => 'nullable|numeric',
            'tanks.2.top_dobi' => 'nullable|numeric',
            'tanks.2.bottom_ffa' => 'nullable|numeric',
            'tanks.2.bottom_moisture' => 'nullable|numeric',
            'tanks.2.bottom_dobi' => 'nullable|numeric',

            // Tank 4 validation
            'tanks.3.oil_level' => 'nullable|numeric',
            'tanks.3.temperature' => 'nullable|numeric',
            'tanks.3.cpo_volume' => 'nullable|numeric',
            'tanks.3.top_ffa' => 'nullable|numeric',
            'tanks.3.top_moisture' => 'nullable|numeric',
            'tanks.3.top_dobi' => 'nullable|numeric',
            'tanks.3.bottom_ffa' => 'nullable|numeric',
            'tanks.3.bottom_moisture' => 'nullable|numeric',
            'tanks.3.bottom_dobi' => 'nullable|numeric',

            // Oil Room validation
            'oil_room.total_cpo' => 'nullable|numeric',
            'oil_room.ffa_cpo' => 'nullable|numeric',
            'oil_room.dobi_cpo' => 'nullable|numeric',
            'oil_room.cs1_cm' => 'nullable|numeric',
            'oil_room.undilute_1' => 'nullable|numeric',
            'oil_room.undilute_2' => 'nullable|numeric',
            'oil_room.setting' => 'nullable|numeric',
            'oil_room.clean_oil' => 'nullable|numeric',
            'oil_room.skim' => 'nullable|numeric',
            'oil_room.mix' => 'nullable|numeric',
            'oil_room.loop_back' => 'nullable|numeric',
        ]);

        // แปลงรูปแบบวันที่ให้ตรงกับ SQL Server
        $formattedDate = date('Y-m-d', strtotime($validated['date']));

        // ตรวจสอบว่ามีข้อมูลวันที่เดียวกันหรือไม่
        $existingRecord = CPOData::where('date', $validated['date'])->first();

        // คำนวณปริมาณ CPO
        $calculatedData = $this->calculateCPOVolume($validated['tanks']);

        // คำนวณ total_cpo + skim สำหรับ StockProduct
        $totalCPO = $calculatedData['total_cpo'] ?? $validated['oil_room']['total_cpo'] ?? 0;
        $skim = $validated['oil_room']['skim'] ?? 0;
        $totalStock = $totalCPO + $skim;

        if ($existingRecord) {
            // Update ข้อมูลที่มีอยู่
            $existingRecord->update([
                // Tank 1 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank1_oil_level' => $validated['tanks'][0]['oil_level'],
                'tank1_temperature' => $validated['tanks'][0]['temperature'],
                'tank1_cpo_volume' => $calculatedData['volumes'][1] ?? $validated['tanks'][0]['cpo_volume'],
                'tank1_ffa' => $validated['tanks'][0]['ffa'],
                'tank1_moisture' => $validated['tanks'][0]['moisture'],
                'tank1_dobi' => $validated['tanks'][0]['dobi'],

                // Tank 2 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank2_oil_level' => $validated['tanks'][1]['oil_level'],
                'tank2_temperature' => $validated['tanks'][1]['temperature'],
                'tank2_cpo_volume' => $calculatedData['volumes'][2] ?? $validated['tanks'][1]['cpo_volume'],
                'tank2_top_ffa' => $validated['tanks'][1]['top_ffa'],
                'tank2_top_moisture' => $validated['tanks'][1]['top_moisture'],
                'tank2_top_dobi' => $validated['tanks'][1]['top_dobi'],
                'tank2_bottom_ffa' => $validated['tanks'][1]['bottom_ffa'],
                'tank2_bottom_moisture' => $validated['tanks'][1]['bottom_moisture'],
                'tank2_bottom_dobi' => $validated['tanks'][1]['bottom_dobi'],

                // Tank 3 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank3_oil_level' => $validated['tanks'][2]['oil_level'],
                'tank3_temperature' => $validated['tanks'][2]['temperature'],
                'tank3_cpo_volume' => $calculatedData['volumes'][3] ?? $validated['tanks'][2]['cpo_volume'],
                'tank3_top_ffa' => $validated['tanks'][2]['top_ffa'],
                'tank3_top_moisture' => $validated['tanks'][2]['top_moisture'],
                'tank3_top_dobi' => $validated['tanks'][2]['top_dobi'],
                'tank3_bottom_ffa' => $validated['tanks'][2]['bottom_ffa'],
                'tank3_bottom_moisture' => $validated['tanks'][2]['bottom_moisture'],
                'tank3_bottom_dobi' => $validated['tanks'][2]['bottom_dobi'],

                // Tank 4 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank4_oil_level' => $validated['tanks'][3]['oil_level'],
                'tank4_temperature' => $validated['tanks'][3]['temperature'],
                'tank4_cpo_volume' => $calculatedData['volumes'][4] ?? $validated['tanks'][3]['cpo_volume'],
                'tank4_top_ffa' => $validated['tanks'][3]['top_ffa'],
                'tank4_top_moisture' => $validated['tanks'][3]['top_moisture'],
                'tank4_top_dobi' => $validated['tanks'][3]['top_dobi'],
                'tank4_bottom_ffa' => $validated['tanks'][3]['bottom_ffa'],
                'tank4_bottom_moisture' => $validated['tanks'][3]['bottom_moisture'],
                'tank4_bottom_dobi' => $validated['tanks'][3]['bottom_dobi'],

                // Oil Room - ใช้ค่าที่คำนวณได้สำหรับ total_cpo
                'total_cpo' => $calculatedData['total_cpo'] ?? $validated['oil_room']['total_cpo'],
                'ffa_cpo' => $validated['oil_room']['ffa_cpo'],
                'dobi_cpo' => $validated['oil_room']['dobi_cpo'],
                'cs1_cm' => $validated['oil_room']['cs1_cm'],
                'undilute_1' => $validated['oil_room']['undilute_1'],
                'undilute_2' => $validated['oil_room']['undilute_2'],
                'setting' => $validated['oil_room']['setting'],
                'clean_oil' => $validated['oil_room']['clean_oil'],
                'skim' => $validated['oil_room']['skim'],
                'mix' => $validated['oil_room']['mix'],
                'loop_back' => $validated['oil_room']['loop_back'],
            ]);

            $cpoData = $existingRecord;
        } else {
            // สร้าง record ใหม่
            $cpoData = CPOData::create([
                'date' => $validated['date'],

                // Tank 1 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank1_oil_level' => $validated['tanks'][0]['oil_level'],
                'tank1_temperature' => $validated['tanks'][0]['temperature'],
                'tank1_cpo_volume' => $calculatedData['volumes'][1] ?? $validated['tanks'][0]['cpo_volume'],
                'tank1_ffa' => $validated['tanks'][0]['ffa'],
                'tank1_moisture' => $validated['tanks'][0]['moisture'],
                'tank1_dobi' => $validated['tanks'][0]['dobi'],

                // Tank 2 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank2_oil_level' => $validated['tanks'][1]['oil_level'],
                'tank2_temperature' => $validated['tanks'][1]['temperature'],
                'tank2_cpo_volume' => $calculatedData['volumes'][2] ?? $validated['tanks'][1]['cpo_volume'],
                'tank2_top_ffa' => $validated['tanks'][1]['top_ffa'],
                'tank2_top_moisture' => $validated['tanks'][1]['top_moisture'],
                'tank2_top_dobi' => $validated['tanks'][1]['top_dobi'],
                'tank2_bottom_ffa' => $validated['tanks'][1]['bottom_ffa'],
                'tank2_bottom_moisture' => $validated['tanks'][1]['bottom_moisture'],
                'tank2_bottom_dobi' => $validated['tanks'][1]['bottom_dobi'],

                // Tank 3 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank3_oil_level' => $validated['tanks'][2]['oil_level'],
                'tank3_temperature' => $validated['tanks'][2]['temperature'],
                'tank3_cpo_volume' => $calculatedData['volumes'][3] ?? $validated['tanks'][2]['cpo_volume'],
                'tank3_top_ffa' => $validated['tanks'][2]['top_ffa'],
                'tank3_top_moisture' => $validated['tanks'][2]['top_moisture'],
                'tank3_top_dobi' => $validated['tanks'][2]['top_dobi'],
                'tank3_bottom_ffa' => $validated['tanks'][2]['bottom_ffa'],
                'tank3_bottom_moisture' => $validated['tanks'][2]['bottom_moisture'],
                'tank3_bottom_dobi' => $validated['tanks'][2]['bottom_dobi'],

                // Tank 4 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
                'tank4_oil_level' => $validated['tanks'][3]['oil_level'],
                'tank4_temperature' => $validated['tanks'][3]['temperature'],
                'tank4_cpo_volume' => $calculatedData['volumes'][4] ?? $validated['tanks'][3]['cpo_volume'],
                'tank4_top_ffa' => $validated['tanks'][3]['top_ffa'],
                'tank4_top_moisture' => $validated['tanks'][3]['top_moisture'],
                'tank4_top_dobi' => $validated['tanks'][3]['top_dobi'],
                'tank4_bottom_ffa' => $validated['tanks'][3]['bottom_ffa'],
                'tank4_bottom_moisture' => $validated['tanks'][3]['bottom_moisture'],
                'tank4_bottom_dobi' => $validated['tanks'][3]['bottom_dobi'],

                // Oil Room - ใช้ค่าที่คำนวณได้สำหรับ total_cpo
                'total_cpo' => $calculatedData['total_cpo'] ?? $validated['oil_room']['total_cpo'],
                'ffa_cpo' => $validated['oil_room']['ffa_cpo'],
                'dobi_cpo' => $validated['oil_room']['dobi_cpo'],
                'cs1_cm' => $validated['oil_room']['cs1_cm'],
                'undilute_1' => $validated['oil_room']['undilute_1'],
                'undilute_2' => $validated['oil_room']['undilute_2'],
                'setting' => $validated['oil_room']['setting'],
                'clean_oil' => $validated['oil_room']['clean_oil'],
                'skim' => $validated['oil_room']['skim'],
                'mix' => $validated['oil_room']['mix'],
                'loop_back' => $validated['oil_room']['loop_back'],
            ]);
        }

        // อัพเดทหรือสร้าง StockProduct
        $stockProduct = StockProduct::where('record_date', $formattedDate)->first();

        if ($stockProduct) {
            // Update ข้อมูลที่มีอยู่
            $stockProduct->update([
                'cpo' => $totalStock
            ]);
        } else {
            // สร้าง record ใหม่
            StockProduct::create([
                'record_date' => $formattedDate,
                'cpo' => $totalStock
            ]);
        }

        return redirect()->route('cpo.index')->with('success', $existingRecord ? 'อัพเดทข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
    }

    public function apiRecord()
    {
        try {
            $cpoTankInfo = CpoTankInfo::select('tank_no', 'height_m', 'diameter_m', 'volume_m3')->get();
            $cpoDensityRef = CpoDensityRef::select('temperature_c', 'density')->get();
            $records = CPOData::all();

            return response()->json([
                'success' => true,
                'records' => $records,
                'cpoTankInfo' => $cpoTankInfo,
                'cpoDensityRef' => $cpoDensityRef,
                'message' => 'โหลดข้อมูลเรียบร้อยแล้ว',
                'count' => $records->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'records' => []
            ], 500);
        }
    }


    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'date' => 'required|date',

            // Tank 1 validation
            'tanks.0.oil_level' => 'nullable|numeric',
            'tanks.0.temperature' => 'nullable|numeric',
            'tanks.0.cpo_volume' => 'nullable|numeric',
            'tanks.0.ffa' => 'nullable|numeric',
            'tanks.0.moisture' => 'nullable|numeric',
            'tanks.0.dobi' => 'nullable|numeric',

            // Tank 2 validation
            'tanks.1.oil_level' => 'nullable|numeric',
            'tanks.1.temperature' => 'nullable|numeric',
            'tanks.1.cpo_volume' => 'nullable|numeric',
            'tanks.1.top_ffa' => 'nullable|numeric',
            'tanks.1.top_moisture' => 'nullable|numeric',
            'tanks.1.top_dobi' => 'nullable|numeric',
            'tanks.1.bottom_ffa' => 'nullable|numeric',
            'tanks.1.bottom_moisture' => 'nullable|numeric',
            'tanks.1.bottom_dobi' => 'nullable|numeric',

            // Tank 3 validation
            'tanks.2.oil_level' => 'nullable|numeric',
            'tanks.2.temperature' => 'nullable|numeric',
            'tanks.2.cpo_volume' => 'nullable|numeric',
            'tanks.2.top_ffa' => 'nullable|numeric',
            'tanks.2.top_moisture' => 'nullable|numeric',
            'tanks.2.top_dobi' => 'nullable|numeric',
            'tanks.2.bottom_ffa' => 'nullable|numeric',
            'tanks.2.bottom_moisture' => 'nullable|numeric',
            'tanks.2.bottom_dobi' => 'nullable|numeric',

            // Tank 4 validation
            'tanks.3.oil_level' => 'nullable|numeric',
            'tanks.3.temperature' => 'nullable|numeric',
            'tanks.3.cpo_volume' => 'nullable|numeric',
            'tanks.3.top_ffa' => 'nullable|numeric',
            'tanks.3.top_moisture' => 'nullable|numeric',
            'tanks.3.top_dobi' => 'nullable|numeric',
            'tanks.3.bottom_ffa' => 'nullable|numeric',
            'tanks.3.bottom_moisture' => 'nullable|numeric',
            'tanks.3.bottom_dobi' => 'nullable|numeric',

            // Oil Room validation
            'oil_room.total_cpo' => 'nullable|numeric',
            'oil_room.ffa_cpo' => 'nullable|numeric',
            'oil_room.dobi_cpo' => 'nullable|numeric',
            'oil_room.cs1_cm' => 'nullable|numeric',
            'oil_room.undilute_1' => 'nullable|numeric',
            'oil_room.undilute_2' => 'nullable|numeric',
            'oil_room.setting' => 'nullable|numeric',
            'oil_room.clean_oil' => 'nullable|numeric',
            'oil_room.skim' => 'nullable|numeric',
            'oil_room.mix' => 'nullable|numeric',
            'oil_room.loop_back' => 'nullable|numeric',
        ]);

        // ค้นหาข้อมูลที่ต้องการอัพเดท
        $cpoData = CPOData::findOrFail($id);

        // เก็บวันที่เดิมเพื่อใช้ในการอัพเดท StockProduct
        $oldDate = $cpoData->date;
        $newDate = $validated['date'];

        // คำนวณปริมาณ CPO
        $calculatedData = $this->calculateCPOVolume($validated['tanks']);

        // คำนวณ total_cpo + skim สำหรับ StockProduct
        $totalCPO = $calculatedData['total_cpo'] ?? $validated['oil_room']['total_cpo'] ?? 0;
        $skim = $validated['oil_room']['skim'] ?? 0;
        $totalStock = $totalCPO + $skim;

        // อัพเดทข้อมูล CPOData
        $cpoData->update([
            'date' => $newDate,

            // Tank 1 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
            'tank1_oil_level' => $validated['tanks'][0]['oil_level'],
            'tank1_temperature' => $validated['tanks'][0]['temperature'],
            'tank1_cpo_volume' => $calculatedData['volumes'][1] ?? $validated['tanks'][0]['cpo_volume'],
            'tank1_ffa' => $validated['tanks'][0]['ffa'],
            'tank1_moisture' => $validated['tanks'][0]['moisture'],
            'tank1_dobi' => $validated['tanks'][0]['dobi'],

            // Tank 2 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
            'tank2_oil_level' => $validated['tanks'][1]['oil_level'],
            'tank2_temperature' => $validated['tanks'][1]['temperature'],
            'tank2_cpo_volume' => $calculatedData['volumes'][2] ?? $validated['tanks'][1]['cpo_volume'],
            'tank2_top_ffa' => $validated['tanks'][1]['top_ffa'],
            'tank2_top_moisture' => $validated['tanks'][1]['top_moisture'],
            'tank2_top_dobi' => $validated['tanks'][1]['top_dobi'],
            'tank2_bottom_ffa' => $validated['tanks'][1]['bottom_ffa'],
            'tank2_bottom_moisture' => $validated['tanks'][1]['bottom_moisture'],
            'tank2_bottom_dobi' => $validated['tanks'][1]['bottom_dobi'],

            // Tank 3 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
            'tank3_oil_level' => $validated['tanks'][2]['oil_level'],
            'tank3_temperature' => $validated['tanks'][2]['temperature'],
            'tank3_cpo_volume' => $calculatedData['volumes'][3] ?? $validated['tanks'][2]['cpo_volume'],
            'tank3_top_ffa' => $validated['tanks'][2]['top_ffa'],
            'tank3_top_moisture' => $validated['tanks'][2]['top_moisture'],
            'tank3_top_dobi' => $validated['tanks'][2]['top_dobi'],
            'tank3_bottom_ffa' => $validated['tanks'][2]['bottom_ffa'],
            'tank3_bottom_moisture' => $validated['tanks'][2]['bottom_moisture'],
            'tank3_bottom_dobi' => $validated['tanks'][2]['bottom_dobi'],

            // Tank 4 - ใช้ค่าที่คำนวณได้สำหรับ cpo_volume
            'tank4_oil_level' => $validated['tanks'][3]['oil_level'],
            'tank4_temperature' => $validated['tanks'][3]['temperature'],
            'tank4_cpo_volume' => $calculatedData['volumes'][4] ?? $validated['tanks'][3]['cpo_volume'],
            'tank4_top_ffa' => $validated['tanks'][3]['top_ffa'],
            'tank4_top_moisture' => $validated['tanks'][3]['top_moisture'],
            'tank4_top_dobi' => $validated['tanks'][3]['top_dobi'],
            'tank4_bottom_ffa' => $validated['tanks'][3]['bottom_ffa'],
            'tank4_bottom_moisture' => $validated['tanks'][3]['bottom_moisture'],
            'tank4_bottom_dobi' => $validated['tanks'][3]['bottom_dobi'],

            // Oil Room - ใช้ค่าที่คำนวณได้สำหรับ total_cpo
            'total_cpo' => $calculatedData['total_cpo'] ?? $validated['oil_room']['total_cpo'],
            'ffa_cpo' => $validated['oil_room']['ffa_cpo'],
            'dobi_cpo' => $validated['oil_room']['dobi_cpo'],
            'cs1_cm' => $validated['oil_room']['cs1_cm'],
            'undilute_1' => $validated['oil_room']['undilute_1'],
            'undilute_2' => $validated['oil_room']['undilute_2'],
            'setting' => $validated['oil_room']['setting'],
            'clean_oil' => $validated['oil_room']['clean_oil'],
            'skim' => $validated['oil_room']['skim'],
            'mix' => $validated['oil_room']['mix'],
            'loop_back' => $validated['oil_room']['loop_back'],
        ]);

        // แปลงรูปแบบวันที่ให้ตรงกับ SQL Server
        $formattedOldDate = date('Y-m-d', strtotime($oldDate));
        $formattedNewDate = date('Y-m-d', strtotime($newDate));

        // อัพเดท StockProduct สำหรับวันที่ใหม่
        $newStockProduct = StockProduct::where('record_date', $formattedNewDate)->first();

        if ($newStockProduct) {
            // Update ข้อมูลที่มีอยู่
            $newStockProduct->update([
                'cpo' => $totalStock
            ]);
        } else {
            // สร้าง record ใหม่
            StockProduct::create([
                'record_date' => $formattedNewDate,
                'cpo' => $totalStock
            ]);
        }

        // ถ้าวันที่เปลี่ยน ให้อัพเดท StockProduct วันที่เดิม (ลบหรือตั้งค่าเป็น 0)
        if ($oldDate !== $newDate) {
            $oldStockProduct = StockProduct::where('record_date', $formattedOldDate)->first();

            if ($oldStockProduct) {
                // ตรวจสอบว่ายังมีข้อมูล CPOData ในวันที่เดิมหรือไม่
                $remainingOldRecords = CPOData::where('date', $oldDate)->count();

                if ($remainingOldRecords === 0) {
                    // ถ้าไม่มีข้อมูลเหลือแล้ว ให้ตั้งค่าเป็น 0
                    $oldStockProduct->update(['cpo' => 0]);
                } else {
                    // ถ้ายังมีข้อมูล ให้คำนวณค่าใหม่
                    $remainingCPOData = CPOData::where('date', $oldDate)->get();
                    $totalCPOOld = $remainingCPOData->sum('total_cpo');
                    $totalSkimOld = $remainingCPOData->sum('skim');
                    $totalStockOld = $totalCPOOld + $totalSkimOld;

                    $oldStockProduct->update(['cpo' => $totalStockOld]);
                }
            }
        }

        return redirect()->route('cpo.index')->with('success', 'อัพเดทข้อมูลสำเร็จ');
    }

    public function destroy($id)
    {
        try {
            // ค้นหาข้อมูลที่ต้องการลบ
            $cpoData = CPOData::findOrFail($id);
            $recordDate = $cpoData->date;
            $clean = str_replace([':AM', ':PM'], [' AM', ' PM'], $recordDate);
            // แปลงรูปแบบวันที่
            $formattedDate = date('Y-m-d', strtotime($recordDate));
            // ลบข้อมูล CPOData
            $cpoData->delete();

            $remainingRecords = CPOData::where('date', $clean)->count();

            $stockProduct = StockProduct::where('record_date', $clean)->first();
            if ($remainingRecords === 0) {
                // ถ้าไม่มีข้อมูล CPOData ในวันที่นี้แล้ว ให้ตั้งค่า cpo เป็น 0
                if ($stockProduct) {
                    $stockProduct->update(['cpo' => 0]);
                }
            } else {
                // ถ้ายังมีข้อมูล CPOData ในวันที่นี้ ให้คำนวณ total_cpo ใหม่
                $remainingCPOData = CPOData::where('date', $recordDate)->get();
                $totalCPO = $remainingCPOData->sum('total_cpo');
                $totalSkim = $remainingCPOData->sum('skim');
                $totalStock = $totalCPO + $totalSkim;

                // อัพเดท StockProduct
                if ($stockProduct) {
                    $stockProduct->update(['cpo' => $totalStock]);
                } else {
                    StockProduct::create([
                        'record_date' => $formattedDate,
                        'cpo' => $totalStock
                    ]);
                }
            }

            return redirect()->route('cpo.index')->with('success', 'ลบข้อมูลสำเร็จ');
        } catch (\Exception $e) {
            return redirect()->route('cpo.index')->with('error', 'เกิดข้อผิดพลาดในการลบข้อมูล: ' . $e->getMessage());
        }
    }
}
