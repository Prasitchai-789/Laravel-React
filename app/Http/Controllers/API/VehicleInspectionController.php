<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VehicleInspection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VehicleInspectionController extends Controller
{
    /**
     * ดึงข้อมูลการตรวจสภาพรถตาม SOP ID
     */
    public function show($sop_id)
    {
        try {
            $inspection = VehicleInspection::where('sop_id', $sop_id)->first();

            return response()->json([
                'success' => true,
                'data' => $inspection
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching vehicle inspection API: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล'
            ], 500);
        }
    }

    /**
     * บันทึกหรืออัปเดตข้อมูลการตรวจสภาพรถ
     */
    public function store(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'sop_id' => 'required',
            'is_clean' => 'nullable',
            'is_covered' => 'nullable',
            'is_no_smell' => 'nullable',
            'is_doc_valid' => 'nullable',
            'remark' => 'nullable|string',
            'inspector_name' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $inspection = VehicleInspection::updateOrCreate(
                ['sop_id' => $request->sop_id],
                [
                    'is_clean' => $request->is_clean ?? false,
                    'is_covered' => $request->is_covered ?? false,
                    'is_no_smell' => $request->is_no_smell ?? false,
                    'is_doc_valid' => $request->is_doc_valid ?? false,
                    'remark' => $request->remark,
                    'inspector_name' => $request->inspector_name,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'บันทึกข้อมูลการตรวจเช็คสภาพรถสำเร็จ',
                'data' => $inspection
            ]);
        } catch (\Exception $e) {
            Log::error('Error saving vehicle inspection API: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            ], 500);
        }
    }
}
