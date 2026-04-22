<?php

namespace App\Http\Controllers\Computer;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Computer\Computer;
use App\Models\Computer\ComputerInspection;
use App\Models\Computer\ComputerChecklistTopic;
use App\Models\Computer\ComputerInspectionPlan;

class ComputerController extends Controller
{
    public function index()
    {
        return Inertia::render('Computer/DailyOverview');
    }

    public function plan()
    {
        return Inertia::render('Computer/InspectionPlan');
    }

    public function form($id)
    {
        return Inertia::render('Computer/InspectionForm', ['computer_id' => $id]);
    }

    public function apiData(Request $request)
    {
        try {
            $date = $request->query('date', now()->format('Y-m-d'));
            $carbonDate = \Carbon\Carbon::parse($date);
            $month = $carbonDate->month;
            $year = $carbonDate->year;

            $computers = Computer::all();
            $inspections = ComputerInspection::whereDate('inspection_date', $date)->get()->keyBy('computer_id');
            
            // Get all plans for this month and year
            $plans = ComputerInspectionPlan::where('month', $month)
                ->where('year', $year)
                ->where('status', 'planned')
                ->pluck('computer_id')
                ->toArray();

            $totalComputers = $computers->count();
            $inspectedCount = $inspections->count();
            $plannedMonthCount = count($plans);
            $completionPercent = $totalComputers > 0 ? round(($inspectedCount / $totalComputers) * 100, 1) : 0;

            $items = $computers->map(function ($computer) use ($inspections, $plans) {
                $inspection = $inspections->get($computer->id);
                
                $brokenCount = 0;
                $abnormalCount = 0;
                
                if ($inspection && is_array($inspection->data)) {
                    foreach ($inspection->data as $item) {
                        if (isset($item['status'])) {
                            if ($item['status'] === 'broken') $brokenCount++;
                            if ($item['status'] === 'abnormal') $abnormalCount++;
                        }
                    }
                }

                $images = [];
                if ($inspection) {
                    $images = collect($inspection->image_paths ?? [])->map(fn($p) => asset('storage/' . $p))->toArray();
                }

                return [
                    'id' => $computer->id,
                    'code_com' => $computer->code_com,
                    'model' => $computer->model,
                    'office' => $computer->office,
                    'is_inspected' => $inspection !== null,
                    'is_planned' => in_array($computer->id, $plans),
                    'broken_count' => $brokenCount,
                    'abnormal_count' => $abnormalCount,
                    'inspection_images' => $images,
                    'checked_by' => $inspection->checked_by ?? null,
                ];
            });

            return response()->json([
                'success' => true,
                'total' => $totalComputers,
                'inspected_count' => $inspectedCount,
                'planned_month_count' => $plannedMonthCount,
                'completion_percent' => $completionPercent,
                'computers' => $items,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $date = $request->query('date', now()->format('Y-m-d'));
            $computer = Computer::findOrFail($id);
            $inspection = ComputerInspection::where('computer_id', $computer->id)
                ->whereDate('inspection_date', $date)
                ->first();

            $topics = ComputerChecklistTopic::where('is_active', true)->orderBy('order', 'asc')->get();

            $images = [];
            if ($inspection) {
                $images = collect($inspection->image_paths ?? [])->map(fn($p) => [
                    'path' => $p,
                    'url' => asset('storage/' . $p)
                ])->toArray();
            }

            return response()->json([
                'success' => true,
                'computer' => [
                    'id' => $computer->id,
                    'code_com' => $computer->code_com,
                    'model' => $computer->model,
                    'asset_id' => $computer->asset_id,
                ],
                'topics' => $topics,
                'inspection' => $inspection ? [
                    'id' => $inspection->id,
                    'data' => $inspection->data,
                    'remark' => $inspection->remark,
                    'images' => $images,
                    'checked_by' => $inspection->checked_by,
                ] : null
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'computer_id' => 'required|integer',
            'date' => 'required|date',
            'data' => 'required|json', // JSON string from frontend
            'remark' => 'nullable|string|max:500',
            'checked_by' => 'required|string|max:100',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'removed_images' => 'nullable|json',
        ]);

        $date = $validated['date'];
        $computerId = $validated['computer_id'];
        
        $inspection = ComputerInspection::where('computer_id', $computerId)
            ->whereDate('inspection_date', $date)
            ->first();

        // Handle File Upload
        $imagePaths = $inspection ? ($inspection->image_paths ?? []) : [];

        if ($request->filled('removed_images')) {
            $removed = json_decode($request->removed_images, true);
            if (is_array($removed)) {
                $imagePaths = array_values(array_diff($imagePaths, $removed));
            }
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $filename = time() . '_comp_' . $computerId . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $imagePaths[] = $file->storeAs('computer_inspections', $filename, 'public');
            }
        }

        ComputerInspection::updateOrCreate(
            [
                'computer_id' => $computerId,
                'inspection_date' => $date,
            ],
            [
                'data' => json_decode($validated['data'], true),
                'remark' => $validated['remark'] ?? null,
                'checked_by' => $validated['checked_by'] ?? null,
                'image_paths' => $imagePaths,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Inspection saved successfully.',
        ]);
    }

    public function apiPlan(Request $request)
    {
        try {
            $year = $request->query('year', now()->year);
            $computers = Computer::all();
            
            // Get inspections for the specified year
            $inspections = ComputerInspection::whereYear('inspection_date', $year)
                ->get()
                ->map(fn($item) => [
                    'id' => $item->id,
                    'computer_id' => $item->computer_id,
                    'month' => $item->inspection_date ? $item->inspection_date->month : null,
                    'is_inspected' => true,
                    'remark' => $item->remark,
                    'checked_by' => $item->checked_by,
                    'inspection_date' => $item->inspection_date ? $item->inspection_date->format('Y-m-d') : null
                ]);

            // Get plans for the specified year
            $plans = ComputerInspectionPlan::where('year', $year)
                ->where('status', 'planned')
                ->get()
                ->map(fn($item) => [
                    'id' => (int) $item->id,
                    'computer_id' => (int) $item->computer_id,
                    'month' => (int) $item->month,
                    'year' => (int) $item->year,
                    'status' => $item->status,
                ]);

            return response()->json([
                'success' => true,
                'computers' => $computers,
                'inspections' => $inspections,
                'plans' => $plans
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function togglePlan(Request $request)
    {
        try {
            $validated = $request->validate([
                'computer_id' => 'required|integer',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer',
            ]);

            $existing = ComputerInspectionPlan::where([
                'computer_id' => $validated['computer_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
            ])->first();

            if ($existing) {
                $existing->delete();
                $status = 'removed';
            } else {
                ComputerInspectionPlan::create([
                    'computer_id' => $validated['computer_id'],
                    'month' => $validated['month'],
                    'year' => $validated['year'],
                    'status' => 'planned',
                    'planned_by' => auth()->user()->name ?? 'System',
                ]);
                $status = 'added';
            }

            return response()->json([
                'success' => true,
                'status' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function report($id)
    {
        $inspection = ComputerInspection::with('computer')->findOrFail($id);
        $topics = ComputerChecklistTopic::where('is_active', true)->orderBy('order', 'asc')->get();
        
        return Inertia::render('Computer/InspectionReport', [
            'inspection' => $inspection,
            'topics' => $topics
        ]);
    }
}
