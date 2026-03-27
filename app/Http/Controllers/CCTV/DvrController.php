<?php

namespace App\Http\Controllers\CCTV;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\CCTV\Dvr;

class DvrController extends Controller
{
    public function index()
    {
        return Inertia::render('CCTV/DvrManagement');
    }

    public function apiIndex()
    {
        return response()->json([
            'success' => true,
            'dvrs' => Dvr::orderBy('id')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'camera_count' => 'required|integer|min:1'
        ]);

        Dvr::create($validated);

        return response()->json(['success' => true, 'message' => 'เพิ่มเครื่องบันทึกสำเร็จ']);
    }

    public function update(Request $request, Dvr $dvr)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'camera_count' => 'required|integer|min:1'
        ]);

        $dvr->update($validated);

        return response()->json(['success' => true, 'message' => 'แก้ไขเครื่องบันทึกสำเร็จ']);
    }

    public function destroy(Dvr $dvr)
    {
        $dvr->delete();
        return response()->json(['success' => true, 'message' => 'ลบเครื่องบันทึกสำเร็จ']);
    }
}
