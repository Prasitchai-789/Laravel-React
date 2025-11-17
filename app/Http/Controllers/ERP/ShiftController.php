<?php

namespace App\Http\Controllers\ERP;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\WIN\WebappEmp;
use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shift_number' => 'required|integer',
            'start_time'   => 'required|date_format:H:i',
            'end_time'     => 'required|date_format:H:i',
            'total_hours'  => 'required|integer',
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string|max:255',
        ]);

        Shift::create($validated);

        return back()->with('success', 'เพิ่มกะใหม่เรียบร้อยแล้ว');
    }

    public function update(Request $request, $id)
    {
        $shift = Shift::findOrFail($id);

        $validated = $request->validate([
            'shift_number' => 'required|integer',
            'start_time'   => 'required|date_format:H:i',
            'end_time'     => 'required|date_format:H:i',
            'total_hours'  => 'required|integer',
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string|max:255',
        ]);

        $shift->update($validated);

        return back()->with('success', 'แก้ไขกะเรียบร้อยแล้ว');
    }

    public function destroy($id)
    {
        $shift = Shift::findOrFail($id);
        $shift->delete();

        return back()->with('success', 'ลบกะเรียบร้อยแล้ว');
    }
}
