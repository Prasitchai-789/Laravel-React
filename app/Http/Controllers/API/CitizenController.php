<?php

namespace App\Http\Controllers\Api;

use Inertia\Inertia;
use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CitizenController extends Controller
{
    public function index()
    {
        $citizens = DB::table('citizens')
            ->select('citizen_id', 'title', 'first_name', 'last_name', 'birth_date', 'gender', 'phone', 'village_name')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Citizens/Index');
    }




    public function bulkUpload(Request $request)
    {
        $data = $request->input('citizens', []);

        $successCount = 0;
        $failCount = 0;
        $failRows = [];

        foreach ($data as $index => $row) {
            // --- Clean citizen_id ---
            // --- Clean citizen_id ---
// ลบช่องว่าง, ขีดกลาง, ตัวอักษรอื่น ๆ ให้เหลือแต่ตัวเลข
            $citizenId = isset($row['citizen_id']) ? preg_replace('/\D/', '', $row['citizen_id']) : null;
            $citizenId = $citizenId ? substr($citizenId, 0, 13) : null; // จำกัด 13 ตัวเท่ากับเลขบัตรประชาชน


            // --- Clean other text fields ---
            $firstName = isset($row['first_name']) ? trim($row['first_name']) : null;
            $lastName = isset($row['last_name']) ? trim($row['last_name']) : null;
            $title = isset($row['title']) ? trim($row['title']) : null;
            $gender = isset($row['gender']) ? trim($row['gender']) : null;
            $phone = isset($row['phone']) ? trim($row['phone']) : null;
            $villageName = isset($row['village_name']) ? trim($row['village_name']) : null;
            $houseNo = isset($row['house_no']) ? trim($row['house_no']) : null;
            $moo = isset($row['moo']) ? trim($row['moo']) : null;
            $alley = isset($row['alley']) ? trim($row['alley']) : null;
            $soi = isset($row['soi']) ? trim($row['soi']) : null;
            $road = isset($row['road']) ? trim($row['road']) : null;
            $subdistrict = isset($row['subdistrict']) ? trim($row['subdistrict']) : null;
            $district = isset($row['district']) ? trim($row['district']) : null;
            $province = isset($row['province']) ? trim($row['province']) : null;
            $religion = isset($row['religion']) ? trim($row['religion']) : null;
            $age = isset($row['age']) ? trim($row['age']) : null;
            $photo = isset($row['photo']) ? trim($row['photo']) : null;

            // --- Convert Thai date to yyyy-mm-dd ---
            $birthDate = $this->convertThaiDate($row['birth_date'] ?? null);
            $cardIssueDate = $this->convertThaiDate($row['card_issue_date'] ?? null);
            $cardExpireDate = $this->convertThaiDate($row['card_expire_date'] ?? null);

            // --- Validate first_name / last_name only ---
            $validator = Validator::make([
                'first_name' => $firstName,
                'last_name' => $lastName,
            ], [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                $failCount++;
                $failRows[] = [
                    'row_index' => $index,
                    'error' => implode(', ', $validator->errors()->all()) . ($citizenId ? '' : ', citizen_id missing'),
                ];
                continue; // skip row
            }

            // --- Check duplicate citizen_id in DB if citizen_id exists ---
            if ($citizenId) {
                $exists = \App\Models\Citizen::where('citizen_id', $citizenId)->exists();
                if ($exists) {
                    $failCount++;
                    $failRows[] = [
                        'row_index' => $index,
                        'error' => "Duplicate citizen_id: $citizenId",
                    ];
                    continue;
                }
            }

            // --- Insert ---
            try {
                \App\Models\Citizen::create([
                    'citizen_id' => $citizenId,
                    'title' => $title,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'birth_date' => $birthDate,
                    'gender' => $gender,
                    'phone' => $phone,
                    'village_name' => $villageName,
                    'house_no' => $houseNo,
                    'moo' => $moo,
                    'alley' => $alley,
                    'soi' => $soi,
                    'road' => $road,
                    'subdistrict' => $subdistrict,
                    'district' => $district,
                    'province' => $province,
                    'card_issue_date' => $cardIssueDate,
                    'card_expire_date' => $cardExpireDate,
                    'religion' => $religion,
                    'age' => $age,
                    'photo' => $photo,
                ]);
                $successCount++;
            } catch (\Exception $e) {
                $failCount++;
                $failRows[] = [
                    'row_index' => $index,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => $successCount,
            'fail' => $failCount,
            'fail_rows' => $failRows,
        ]);
    }

    private function convertThaiDate($thaiDate)
    {
        if (!$thaiDate)
            return null;

        // Excel serial number
        if (is_numeric($thaiDate)) {
            $dateObj = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($thaiDate);
            return $dateObj->format('Y-m-d');
        }

        if ($thaiDate instanceof \DateTime) {
            return $thaiDate->format('Y-m-d');
        }

        if (is_string($thaiDate)) {
            // ถ้าเป็น พ.ศ. แปลงเป็น ค.ศ.
            if (preg_match('/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/', $thaiDate, $matches)) {
                $year = (int) $matches[1];
                $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
                $day = str_pad($matches[3], 2, '0', STR_PAD_LEFT);
                if ($year > 2500)
                    $year -= 543;
                return "$year-$month-$day";
            }
        }

        return null;
    }

    public function community()
    {
        $rawProvinces = DB::table('citizens')
            ->select('province')
            ->whereNotNull('province')
            ->where('province', '!=', '')
            ->pluck('province');

        // Normalize ให้เหลือรูปเดียวกัน
        $provinces = $rawProvinces->map(function ($p) {
            return $this->normalizeProvince($p);
        })->unique()->sort()->values();

        return Inertia::render('Citizens/CommunityPage/Index', [
            'provinces' => $provinces,
        ]);
    }


    // API สำหรับดึงอำเภอ/ตำบล/หมู่บ้าน
    public function getLocations(Request $request)
    {
        try {
            $province = $this->normalizeProvince($request->input('province'));
            $district = $request->input('district');

            if (!$province) {
                return response()->json([
                    'error' => 'จังหวัดต้องไม่ว่างเปล่า'
                ], 400);
            }

            $query = DB::table('citizens')
                ->whereNotNull('province')
                ->where('province', '!=', '');

            // province อาจเก็บได้หลายแบบ ให้ใช้ LIKE match
            $query->where(function ($q) use ($province) {
                $q->where('province', $province)
                    ->orWhere('province', 'จังหวัด' . $province)
                    ->orWhere('province', 'จ.' . $province);
            });

            $districts = $query->clone()
                ->select('district')
                ->whereNotNull('district')
                ->where('district', '!=', '')
                ->distinct()
                ->orderBy('district')
                ->pluck('district');

            $subdistricts = $query->clone()
                ->when($district, function ($q) use ($district) {
                    return $q->where('district', $district);
                })
                ->select('subdistrict')
                ->whereNotNull('subdistrict')
                ->where('subdistrict', '!=', '')
                ->distinct()
                ->orderBy('subdistrict')
                ->pluck('subdistrict');

            return response()->json([
                'districts' => $districts,
                'subdistricts' => $subdistricts,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' . $e->getMessage()
            ], 500);
        }
    }


    public function getVillages(Request $request)
    {
        try {
            $subdistrict = $request->input('subdistrict');

            if (!$subdistrict) {
                return response()->json([
                    'error' => 'ตำบลต้องไม่ว่างเปล่า'
                ], 400);
            }

            $villages = DB::table('citizens')
                ->where('subdistrict', $subdistrict)
                ->whereNotNull('village_name')
                ->where('village_name', '!=', '')
                ->select(
                    'village_name',
                    DB::raw("SUM(CASE WHEN gender='ชาย' THEN 1 ELSE 0 END) as male"),
                    DB::raw("SUM(CASE WHEN gender='หญิง' THEN 1 ELSE 0 END) as female")
                )
                ->groupBy('village_name')
                ->orderBy('village_name')
                ->get();

            return response()->json($villages);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการดึงข้อมูลหมู่บ้าน: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeProvince($province)
    {
        if (!$province)
            return null;

        // ตัด "จังหวัด" และ "จ." ออก
        $province = trim($province);
        $province = preg_replace('/^(จังหวัด|จ\.)/', '', $province);

        return trim($province);
    }

}
