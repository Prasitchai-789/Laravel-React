<?php

namespace App\Http\Controllers\Population;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Perple;
use App\Models\SeederStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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
        // 1) Validate ข้อมูล
        $validated = $request->validate([
            'national_id'       => 'nullable|string|max:20',
            'title'             => 'required|string|max:255',
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'birthdate'         => 'nullable|date',
            'gender'            => 'nullable|in:ชาย,หญิง,อื่นๆ,M,F,OTHER',
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

        // 2) แปลงค่า null → "" สำหรับ text fields
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

        // 3) แปลง gender ไทย → code SQL
        $genderMap = ['ชาย' => 'M', 'หญิง' => 'F', 'อื่นๆ' => 'OTHER'];
        if (!empty($validated['gender']) && isset($genderMap[$validated['gender']])) {
            $validated['gender'] = $genderMap[$validated['gender']];
        }

        // 4) ตรวจสอบซ้ำตาม ชื่อ-นามสกุล-ตำบล-อำเภอ-จังหวัด
        $duplicateCount = DB::table('people_populations')
            ->where('first_name', $validated['first_name'])
            ->where('last_name', $validated['last_name'])
            ->where('subdistrict_name', $validated['subdistrict_name'])
            ->where('district_name', $validated['district_name'])
            ->where('province_name', $validated['province_name'])
            ->count();

        if ($duplicateCount > 0) {
            return back()->withErrors([
                'duplicate' => 'มีข้อมูลคนนี้อยู่แล้วในระบบ (' . $duplicateCount . ' รายการ)'
            ]);
        }

        // 5) จัดการเลขบัตร → hash แบบสั้น 20 ตัว
        if (!empty($validated['national_id'])) {
            $hash = md5($validated['national_id']);
            $validated['national_id'] = substr($hash, 0, 20);
        } else {
            $placeholder = 'NO_ID_' . uniqid();
            $hash = md5($placeholder);
            $validated['national_id'] = substr($hash, 0, 20);
        }

        // 6) timestamp
        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        // 7) insert
        DB::table('people_populations')->insert($validated);

        return redirect()->route('populations.index')
            ->with('success', 'เพิ่มข้อมูลประชากรเรียบร้อยแล้ว!');
    }

    public function getSeederStatusItems()
    {
        // ดึงแค่ id กับ name
        $items = SeederStatus::select('id', 'name')->get();

        return response()->json($items);
    }


    public function summary()
    {
        return Inertia::render(
            'Populations/PopulationSummary/PopulationSummary'
        );
    }


    public function summaryJson(Request $request)
    {
        try {
            // 1️⃣ รับค่า filter
            $province = trim($request->input('province', ''));
            $amphoe   = trim($request->input('amphoe', ''));
            $tambon   = trim($request->input('tambon', ''));

            \Log::info('summaryJson request', compact('province', 'amphoe', 'tambon'));

            // 2️⃣ Query Webapp_City
            $city = DB::connection('sqlsrv2')->table('Webapp_City')
                ->when($province, fn($q) => $q->where('ProvinceName', 'like', "%{$province}%"))
                ->when($amphoe, fn($q) => $q->where('DistrictName', 'like', "%{$amphoe}%"))
                ->when($tambon, fn($q) => $q->where('SubDistrictName', 'like', "%{$tambon}%"))
                ->first();

            if (!$city) {
                return response()->json([
                    'count' => 0,
                    'items' => [],
                    'message' => 'ไม่พบนิคมใน Webapp_City'
                ]);
            }

            // 3️⃣ Query perples แบบปลอดภัย
            $peopleQuery = DB::connection('sqlsrv')->table('perples')
                ->select('id', 'title', 'first_name', 'last_name', 'house_no', 'village_no', 'subdistrict_name', 'district_name', 'province_name');

            if (!empty($city->ProvinceName)) {
                $peopleQuery->where('province_name', $city->ProvinceName);
            }
            if (!empty($city->DistrictName)) {
                $peopleQuery->where('district_name', $city->DistrictName);
            }
            if (!empty($city->SubDistrictName)) {
                $peopleQuery->where('subdistrict_name', $city->SubDistrictName);
            }

            // 4️⃣ ดึงข้อมูลจริง
            try {
                $people = $peopleQuery->get();
            } catch (\Exception $e) {
                \Log::error('Perples query failed', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return response()->json([
                    'count' => 0,
                    'items' => [],
                    'error' => 'เกิดข้อผิดพลาดในการดึงข้อมูล perples'
                ], 500);
            }

            return response()->json([
                'count' => $people->count(),
                'items' => $people
            ]);
        } catch (\Exception $e) {
            \Log::error('summaryJson failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'count' => 0,
                'items' => [],
                'error' => 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล'
            ], 500);
        }
    }
}
