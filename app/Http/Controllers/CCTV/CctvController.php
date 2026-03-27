<?php

namespace App\Http\Controllers\CCTV;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\CCTV\Dvr;
use App\Models\CCTV\Camera;
use App\Models\CCTV\CctvInspection;
use Carbon\Carbon;

use Illuminate\Support\Facades\Storage;

class CctvController extends Controller
{
    public function index()
    {
        return Inertia::render('CCTV/CctvInspection');
    }

    public function form($id)
    {
        return Inertia::render('CCTV/CctvInspectionForm', ['dvr_id' => $id]);
    }

    /**
     * API — Dashboard summary + DVR list for a date (Daily Overview)
     */
    public function apiData(Request $request)
    {
        try {
            $date = $request->query('date', now()->format('Y-m-d'));

            $dvrs = Dvr::all();
            $inspections = CctvInspection::whereDate('inspection_date', $date)->get()->keyBy('dvr_id');

            $totalDvrs = $dvrs->count();
            $inspectedCount = $inspections->count();
            $completionPercent = $totalDvrs > 0 ? round(($inspectedCount / $totalDvrs) * 100, 1) : 0;

            // Build DVR overview reporting
            $dvrData = $dvrs->map(function ($dvr) use ($inspections) {
                $inspection = $inspections->get($dvr->id);
                
                $brokenCount = 0;
                $noSignalCount = 0;
                if ($inspection && is_array($inspection->camera_data)) {
                    foreach ($inspection->camera_data as $cam) {
                        if (isset($cam['status'])) {
                            if ($cam['status'] === 'broken') $brokenCount++;
                            if ($cam['status'] === 'no_signal') $noSignalCount++;
                        }
                    }
                }

                return [
                    'id' => $dvr->id,
                    'name' => $dvr->name,
                    'camera_count' => $dvr->camera_count,
                    'is_inspected' => $inspection !== null,
                    'broken_count' => $brokenCount,
                    'no_signal_count' => $noSignalCount,
                    'inspection_image' => $inspection ? ($inspection->image_path ? asset('storage/' . $inspection->image_path) : null) : null,
                    'checked_by' => $inspection->checked_by ?? null,
                ];
            });

            return response()->json([
                'success' => true,
                'total_dvrs' => $totalDvrs,
                'inspected_count' => $inspectedCount,
                'completion_percent' => $completionPercent,
                'dvrs' => $dvrData,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Return specific DVR data and its inspection state for a specific date
     */
    public function show(Request $request, $id)
    {
        try {
            $date = $request->query('date', now()->format('Y-m-d'));
            $dvr = Dvr::findOrFail($id);
            $inspection = CctvInspection::where('dvr_id', $dvr->id)
                ->whereDate('inspection_date', $date)
                ->first();

            return response()->json([
                'success' => true,
                'dvr' => [
                    'id' => $dvr->id,
                    'name' => $dvr->name,
                    'camera_count' => $dvr->camera_count,
                ],
                'inspection' => $inspection ? [
                    'id' => $inspection->id,
                    'camera_data' => $inspection->camera_data,
                    'dvr_remark' => $inspection->dvr_remark,
                    'image_path' => $inspection->image_path ? asset('storage/' . $inspection->image_path) : null,
                    'checked_by' => $inspection->checked_by,
                ] : null
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Store inspections for a DVR on a specific date (JSON Array + Image)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'dvr_id' => 'required|integer|exists:dvrs,id',
            'date' => 'required|date',
            'camera_data' => 'required|json', // JSON string from frontend
            'dvr_remark' => 'nullable|string|max:500',
            'checked_by' => 'required|string|max:100',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $date = $validated['date'];
        $dvrId = $validated['dvr_id'];
        
        $inspection = CctvInspection::where('dvr_id', $dvrId)
            ->whereDate('inspection_date', $date)
            ->first();

        // Handle File Upload
        $imagePath = $inspection ? $inspection->image_path : null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $dvrId . '_' . $file->getClientOriginalName();
            $imagePath = $file->storeAs('cctv_inspections', $filename, 'public');
        }

        CctvInspection::updateOrCreate(
            [
                'dvr_id' => $dvrId,
                'inspection_date' => $date,
            ],
            [
                'camera_data' => json_decode($validated['camera_data'], true),
                'dvr_remark' => $validated['dvr_remark'] ?? null,
                'checked_by' => $validated['checked_by'] ?? null,
                'image_path' => $imagePath,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Inspection saved successfully.',
        ]);
    }
}
