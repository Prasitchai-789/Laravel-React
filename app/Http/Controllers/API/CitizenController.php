<?php

namespace App\Http\Controllers\Api;

use Inertia\Inertia;
use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Crypt; // สำหรับ encrypt/decrypt
use Illuminate\Support\Facades\Hash;  // สำหรับ hash
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CitizenController extends Controller
{
    public function index()
    {
        // ดึงข้อมูลเฉพาะที่ไม่ใช่ข้อมูลสำคัญ (เช่น citizen_id / phone) หรือส่งแบบ masked
        $citizens = DB::table('citizens')
            ->select('title', 'first_name', 'last_name', 'birth_date', 'gender', 'village_name')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Citizens/Index', [
            'citizens' => $citizens
        ]);
    }
    public function community()
    {
        // ตัวอย่าง: ส่งข้อมูลบางอย่างไปหน้า Inertia
        $citizens = Citizen::orderBy('created_at', 'desc')->get();

        return Inertia::render('Citizens/CommunityPage/Index', [
            'citizens' => $citizens
        ]);
    }

    public function bulkUpload(Request $request)
    {
        // $data = $request->input('citizens', []);
        $successCount = 0;
        $failCount = 0;
        $failRows = [];
        $fileHashes = []; // ใช้ hash ตรวจ duplicate ในไฟล์

        foreach ($data as $index => $row) {
            $citizenIdRaw = $row['citizen_id'] ?? null;
            if (!$citizenIdRaw) {
                $failRows[] = ['row_index' => $index, 'error' => 'Missing citizen_id'];
                $failCount++;
                continue;
            }

            $citizenIdClean = preg_replace('/\D/', '', $citizenIdRaw);
            $citizenIdClean = substr($citizenIdClean, 0, 13);

            // Hash citizen_id สำหรับตรวจซ้ำ
            $citizenIdHash = Hash::make($citizenIdClean);

            if (in_array($citizenIdHash, $fileHashes)) {
                $failRows[] = ['row_index' => $index, 'error' => "Duplicate citizen_id in file"];
                $failCount++;
                continue;
            }
            $fileHashes[] = $citizenIdHash;

            // Clean fields
            $firstName = trim($row['first_name'] ?? '');
            $lastName = trim($row['last_name'] ?? '');
            $title = trim($row['title'] ?? null);
            $gender = trim($row['gender'] ?? null);
            $phone = trim($row['phone'] ?? null);
            $villageName = trim($row['village_name'] ?? null);

            $birthDate = $this->convertThaiDate($row['birth_date'] ?? null);

            // Validation
            $validator = Validator::make([
                'first_name' => $firstName,
                'last_name' => $lastName,
            ], [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                $failRows[] = ['row_index' => $index, 'error' => implode(', ', $validator->errors()->all())];
                $failCount++;
                continue;
            }

            // ตรวจ duplicate ใน DB (ใช้ citizen_id hash)
            $exists = Citizen::all()->contains(function ($c) use ($citizenIdClean) {
                return Hash::check($citizenIdClean, $c->citizen_id);
            });

            if ($exists) {
                $failRows[] = ['row_index' => $index, 'error' => 'Duplicate citizen_id in DB'];
                $failCount++;
                continue;
            }

            try {
                Citizen::create([
                    // 'citizen_id' => Hash::make($citizenIdClean),      // Hash ก่อนเก็บ
                    'title' => $title,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'birth_date' => $birthDate,
                    'gender' => $gender,
                    'phone' => $phone ? Crypt::encryptString($phone) : null, // Encrypt เบอร์
                    'village_name' => $villageName,
                    // fields อื่น ๆ ตามเดิม
                ]);
                $successCount++;
            } catch (\Exception $e) {
                $failRows[] = ['row_index' => $index, 'error' => $e->getMessage()];
                $failCount++;
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
        if (!$thaiDate) return null;

        if (is_numeric($thaiDate)) {
            $dateObj = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($thaiDate);
            return $dateObj->format('Y-m-d');
        }

        if ($thaiDate instanceof \DateTime) {
            return $thaiDate->format('Y-m-d');
        }

        if (is_string($thaiDate)) {
            if (preg_match('/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/', $thaiDate, $matches)) {
                $year = (int)$matches[1];
                $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
                $day = str_pad($matches[3], 2, '0', STR_PAD_LEFT);
                if ($year > 2500) $year -= 543;
                return "$year-$month-$day";
            }
        }

        return null;
    }
}
