<?php

namespace App\Http\Controllers;

use App\Models\Chemical;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class ChemicalMasterController extends Controller
{
    /**
     * แสดงหน้าจัดการสารเคมี (Inertia page)
     */
    public function index()
    {
        $chemicals = Chemical::orderBy('name')->get();

        return Inertia::render('Chemical/ChemicalMaster', [
            'chemicals' => $chemicals,
        ]);
    }

    /**
     * เพิ่มสารเคมีใหม่
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:chemicals,name',
            'unit' => 'required|string|max:50',
        ], [
            'name.required' => 'กรุณาระบุชื่อสารเคมี',
            'name.unique' => 'ชื่อสารเคมีนี้มีอยู่ในระบบแล้ว',
            'unit.required' => 'กรุณาระบุหน่วย',
        ]);

        $chemical = Chemical::create([
            'name' => $request->name,
            'unit' => $request->unit,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'เพิ่มสารเคมีเรียบร้อยแล้ว',
            'data' => $chemical,
        ]);
    }

    /**
     * แก้ไขสารเคมี
     */
    public function update(Request $request, $id): JsonResponse
    {
        $chemical = Chemical::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:chemicals,name,' . $id,
            'unit' => 'required|string|max:50',
        ], [
            'name.required' => 'กรุณาระบุชื่อสารเคมี',
            'name.unique' => 'ชื่อสารเคมีนี้มีอยู่ในระบบแล้ว',
            'unit.required' => 'กรุณาระบุหน่วย',
        ]);

        $chemical->update([
            'name' => $request->name,
            'unit' => $request->unit,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขสารเคมีเรียบร้อยแล้ว',
            'data' => $chemical,
        ]);
    }

    /**
     * ลบสารเคมี
     */
    public function destroy($id): JsonResponse
    {
        $chemical = Chemical::findOrFail($id);
        $chemical->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบสารเคมีเรียบร้อยแล้ว',
        ]);
    }

    /**
     * API ดึงรายชื่อสารเคมีทั้งหมด (ใช้ใน UseForm)
     */
    public function apiList(): JsonResponse
    {
        $chemicals = Chemical::orderBy('name')->get(['id', 'name', 'unit']);

        return response()->json([
            'success' => true,
            'data' => $chemicals,
        ]);
    }
}
