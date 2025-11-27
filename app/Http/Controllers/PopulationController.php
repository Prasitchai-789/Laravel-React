<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Perple;
use Illuminate\Support\Facades\DB;

class PopulationController extends Controller
{
    public function index()
    {
        return Inertia::render('Populations/PopulationData/Index');
    }
    public function onCreate()
    {
        return Inertia::render('Populations/PopulationData/components/FormCreate');
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
                    'title' => $row['title'],
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'house_no' => $row['house_no'],
                    'village_no' => $row['village_no'],
                    'subdistrict_name' => $row['subdistrict_name'],
                    'district_name' => $row['district_name'],
                    'province_name' => $row['province_name'],
                ])->first();

                if ($exists) {
                    // เก็บข้อมูลซ้ำเพื่อนำไปแสดง
                    $duplicates[] = [
                        'title' => $row['title'],
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


    public function CreatePopulation(Request $request)
    {
        // 1) ตรวจสอบข้อมูลขั้นต่ำ
        $validated = $request->validate([
            'national_id'       => 'nullable|string|max:20',
            'title'             => 'required|string|max:255',
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'birthdate'         => 'nullable|date',
            'gender'            => 'nullable|in:M,F,OTHER',
            'house_no'          => 'required|string|max:255',
            'village_no'        => 'required|integer',
            'village_name'      => 'nullable|string|max:255',
            'city_id'           => 'nullable|integer',
            'id_card_issued_at' => 'nullable|date',
            'id_card_expired_at' => 'nullable|date',
            'religion'          => 'nullable|string|max:255',
            'age_at_import'     => 'nullable|integer',
            'phone'             => 'nullable|string|max:255',

            'subdistrict_name'  => 'required|string|max:255',
            'district_name'     => 'required|string|max:255',
            'province_name'     => 'nullable|string|max:255',
        ]);

        // 2) แปลงค่า null เป็น "" สำหรับฟิลด์ text ยกเว้น national_id
        $textFields = [
            'title',
            'first_name',
            'last_name',
            'house_no',
            'village_name',
            'subdistrict_name',
            'district_name',
            'province_name',
            'religion',
            'phone'
        ];
        foreach ($textFields as $field) {
            $validated[$field] = $validated[$field] ?? '';
        }

        // =========================
        // CASE 1: มีบัตรประชาชน
        // =========================
        if (!empty($validated['national_id'])) {
            $exists = DB::table('people_populations')
                ->where('national_id', $validated['national_id'])
                ->exists();

            if ($exists) {
                return back()->withErrors([
                    'national_id' => 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว',
                ]);
            }

            // national_id ใช้ตามจริง
        }
        // =========================
        // CASE 2: ไม่มีบัตรประชาชน
        // =========================
        else {
            // ให้ค่า placeholder เพื่อหลีกเลี่ยง unique index
            $validated['national_id'] = 'NO_ID_' . uniqid();
        }

        // 3) เพิ่ม timestamp
        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        // 4) บันทึกลง DB
        DB::table('people_populations')->insert($validated);

        return redirect()->route('populations.index')
            ->with('success', 'เพิ่มข้อมูลประชากรเรียบร้อยแล้ว!');
    }
}
