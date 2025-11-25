<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Perple;

class PopulationController extends Controller
{
    public function index()
    {
        return Inertia::render('Populations/PopulationData/Index');
    }


    // ใน PopulationController
    public function importSimple(Request $request)
    {
        try {
            \Log::info('Received import request', [
                'file_name' => $request->file_name,
                'rows_count' => count($request->rows ?? [])
            ]);

            if (!empty($request->rows)) {
                \Log::info('Sample row data:', $request->rows[0]);
            }

            // Validation
            $validated = $request->validate([
                'rows' => 'required|array',
                'rows.*.title' => 'nullable|string',
                'rows.*.first_name' => 'required|string',
                'rows.*.last_name' => 'required|string',
                'rows.*.house_no' => 'nullable|string',
                'rows.*.village_no' => 'nullable|integer',
                'rows.*.subdistrict_name' => 'nullable|string',
                'rows.*.district_name' => 'nullable|string',
                'rows.*.province_name' => 'nullable|string',
                'rows.*.note' => 'nullable|string',
            ]);

            $imported = 0;
            $skipped = 0;
            $duplicate = 0;
            $skipped_rows = [];

            foreach ($validated['rows'] as $index => $row) {
                try {
                    // ตรวจสอบข้อมูลซ้ำแบบง่ายๆ โดยไม่ใช้ deleted_at
                    $exists = \App\Models\Perple::where('first_name', $row['first_name'])
                        ->where('last_name', $row['last_name'])
                        ->where('house_no', $row['house_no'] ?? null)
                        ->exists();

                    if ($exists) {
                        $duplicate++;
                        $skipped++;
                        $skipped_rows[] = [
                            'row_number' => $index + 1,
                            'name' => ($row['title'] ?? '') . ' ' . $row['first_name'] . ' ' . $row['last_name'],
                            'reason' => 'ข้อมูลซ้ำ'
                        ];
                        \Log::info("ข้อมูลซ้ำ: {$row['first_name']} {$row['last_name']}");
                        continue;
                    }

                    // บันทึกข้อมูล
                    \App\Models\Perple::create([
                        'title' => $row['title'] ?? null,
                        'first_name' => $row['first_name'],
                        'last_name' => $row['last_name'],
                        'house_no' => $row['house_no'] ?? null,
                        'village_no' => $row['village_no'] ?? null,
                        'subdistrict_name' => $row['subdistrict_name'] ?? null,
                        'district_name' => $row['district_name'] ?? null,
                        'province_name' => $row['province_name'] ?? null,
                        'note' => $row['note'] ?? null,
                    ]);
                    $imported++;

                    \Log::info("นำเข้าสำเร็จ: {$row['first_name']} {$row['last_name']}");
                } catch (\Exception $e) {
                    $skipped++;
                    $skipped_rows[] = [
                        'row_number' => $index + 1,
                        'name' => ($row['title'] ?? '') . ' ' . ($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''),
                        'reason' => $e->getMessage(),
                    ];
                    \Log::error("Error importing row {$index}: " . $e->getMessage());
                }
            }

            $reportData = [
                'imported' => $imported,
                'duplicate' => $duplicate,
                'skipped' => $skipped,
                'skipped_rows' => $skipped_rows,
                'success' => true,
                'message' => "นำเข้าข้อมูลสำเร็จ {$imported} รายการ, พบข้อมูลซ้ำ {$duplicate} รายการ"
            ];

            \Log::info('Import completed', $reportData);

            return response()->json([
                'success' => true,
                'message' => "นำเข้าข้อมูลสำเร็จ {$imported} รายการ",
                'reportData' => $reportData
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error: ' . json_encode($e->errors()));

            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Import error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' . $e->getMessage()
            ], 500);
        }
    }
}
