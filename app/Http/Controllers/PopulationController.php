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
            $rows = $request->rows;

            $imported = 0;
            $duplicates = []; // เก็บข้อมูลที่เจอซ้ำใน DB
            $skipped_rows = [];

            foreach ($rows as $row) {

                // เช็คว่าซ้ำใน DB หรือไม่
                $exists = Perple::where([
                    'first_name'       => $row['first_name'],
                    'last_name'        => $row['last_name'],
                    'house_no'         => $row['house_no'],
                    'village_no'       => $row['village_no'],
                    'subdistrict_name' => $row['subdistrict_name'],
                ])->first();

                if ($exists) {
                    // เก็บข้อมูลซ้ำเพื่อนำไปแสดง
                    $duplicates[] = [
                        'first_name' => $row['first_name'],
                        'last_name' => $row['last_name'],
                        'house_no' => $row['house_no'],
                        'village_no' => $row['village_no'],
                        'subdistrict_name' => $row['subdistrict_name'],
                        'district_name' => $row['district_name'],
                        'province_name' => $row['province_name'],
                    ];
                    continue;
                }

                // ถ้าไม่ซ้ำ ให้บันทึก
                Perple::create([
                    'title' => $row['title'] ?? null,
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'house_no' => $row['house_no'],
                    'village_no' => $row['village_no'],
                    'subdistrict_name' => $row['subdistrict_name'],
                    'district_name' => $row['district_name'],
                    'province_name' => $row['province_name'],
                    'note' => $row['note'] ?? null,
                ]);

                $imported++;
            }

            return response()->json([
                'success' => true,
                'message' => "นำเข้าข้อมูลสำเร็จ $imported รายการ",
                'reportData' => [
                    'imported'   => $imported,
                    'duplicate'  => count($duplicates),
                    'duplicates' => $duplicates, // ⭐ ส่งข้อมูลซ้ำกลับไปเลย
                    'skipped_rows' => $skipped_rows
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
