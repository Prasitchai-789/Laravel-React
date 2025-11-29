<?php

namespace App\Http\Controllers\Population;

use App\Http\Controllers\Controller;
use App\Models\PeoplePopulation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PopulationImportController extends Controller
{
    public function index()
    {
        return Inertia::render('Populations/Import');
    }


    public function table()
    {
        $populations = PeoplePopulation::orderBy('id', 'desc')
            ->paginate(50)
            ->through(fn($p) => [
                'id' => $p->id,
                'national_id' => $p->national_id,
                'title' => $p->title,
                'first_name' => $p->first_name,
                'last_name' => $p->last_name,
                'birthdate' => $p->birthdate,
                'gender' => $p->gender,
                'house_no' => $p->house_no,
                'village_no' => $p->village_no,
                'village_name' => $p->village_name,
                'subdistrict_name' => $p->subdistrict_name,
                'district_name' => $p->district_name,
                'province_name' => $p->province_name,
                'religion' => $p->religion,
                'phone' => $p->phone,

            ]);

        return Inertia::render('Populations/components/PopulationsTable', [
            'populations' => $populations,
            'filters' => [
                'search' => request()->input('search', ''),
            ],
        ]);
    }
    // // {"national_id":"4470800003747","prefix":"นาย","first_name":"มรุพงษ์","last_name":"นาขมิ้น","birthdate":null,"gender":"ชาย","house_no":"66",
    // "village_no":null,"village_name":"แขวงวัดสามพระยา","subdistrict_name":"วัดสามพระยา","district_name":"พระนคร","province_name":"กรุงเทพมหานคร",
    // "religion":"พุทธ","age_at_import":64,"phone":null}
    public function import(Request $request)
    {
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '1024M');

        $rows = $request->input('rows', []);
        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $skippedRows = [];

        if (!is_array($rows) || empty($rows)) {
            return response()->json([
                'success' => false,
                'message' => 'NO DATA RECEIVED',
            ], 422);
        }

        foreach ($rows as $i => $row) {
            try {
                // ----------------------------
                // ทำความสะอาดและ hash เลขบัตร
                // ----------------------------
                $nationalIdMd5 = null;
                $nationalIdSha = null;
                if (!empty($row['national_id'])) {
                    $cleanedId = preg_replace('/\s+/', '', trim($row['national_id']));
                    if (!empty($cleanedId)) {
                        $nationalIdMd5 = substr(hash('md5', $cleanedId), 0, 20);
                        $nationalIdSha = substr(hash('sha256', $cleanedId), 0, 32);
                    }
                }

                // ----------------------------
                // hash เบอร์โทร
                // ----------------------------
                $phoneMd5 = null;
                $phoneSha = null;
                if (!empty($row['phone'])) {
                    $cleanedPhone = preg_replace('/\s+/', '', trim($row['phone']));
                    if (!empty($cleanedPhone)) {
                        $phoneMd5 = hash('md5', $cleanedPhone);
                        $phoneSha = substr(hash('sha256', $cleanedPhone), 0, 32);
                    }
                }

                // ----------------------------
                // แปลงวันที่ & normalize gender
                // ----------------------------
                $birthdate = $this->convertThaiDate($row['birthdate'] ?? null);
                $idCardIssuedAt = $this->convertThaiDate($row['วันทำบัตร'] ?? null);
                $idCardExpiredAt = $this->convertThaiDate($row['วันหมดอายุ'] ?? null);

                $genderMap = [
                    'ชาย' => 'M',
                    'หญิง' => 'F',
                    'male' => 'M',
                    'female' => 'F',
                    '1' => 'M',
                    '2' => 'F'
                ];
                $gender = $genderMap[strtolower(trim($row['gender'] ?? ''))] ?? 'OTHER';

                $firstName = $row['first_name'] ?? $row['ชื่อ'] ?? 'ไม่ระบุ';
                $lastName  = $row['last_name'] ?? $row['นามสกุล'] ?? 'ไม่ระบุ';

                // ----------------------------
                // ข้อมูลสำหรับบันทึก
                // ----------------------------
                $data = [
                    'title'            => substr($row['prefix'] ?? $row['คำนำหน้า'] ?? '', 0, 255),
                    'first_name'       => substr($firstName, 0, 255),
                    'last_name'        => substr($lastName, 0, 255),
                    'birthdate'        => $birthdate,
                    'gender'           => $gender,
                    'house_no'         => substr($row['house_no'] ?? $row['บ้านเลขที่'] ?? '', 0, 255),
                    'village_no'       => $this->extractNumber($row['village_no'] ?? $row['หมู่ที่'] ?? null),
                    'village_name'     => substr($row['village_name'] ?? $row['ชื่อหมู่บ้าน'] ?? '', 0, 255),
                    'subdistrict_name' => substr($this->cleanCity($row['subdistrict_name'] ?? $row['ตำบล'] ?? ''), 0, 255),
                    'district_name'    => substr($this->cleanCity($row['district_name'] ?? $row['อำเภอ'] ?? ''), 0, 255),
                    'province_name'    => substr($this->cleanCity($row['province_name'] ?? $row['จังหวัด'] ?? ''), 0, 255),
                    'id_card_issued_at' => $idCardIssuedAt,
                    'id_card_expired_at' => $idCardExpiredAt,
                    'religion'         => substr($row['religion'] ?? $row['ศาสนา'] ?? '', 0, 255),
                    'age_at_import'    => $this->extractNumber($row['age_at_import'] ?? $row['อายุ'] ?? null),
                    'phone'            => $row['phone'] ?? null,
                    'phone_md5'        => $phoneMd5,
                    'phone_sha'        => $phoneSha,
                    'national_id'      => $nationalIdMd5,
                    'national_id_sha'  => $nationalIdSha,
                    'updated_at'       => now(),
                ];

                // ----------------------------
                // insert หรือ update
                // ----------------------------
                if ($nationalIdMd5) {
                    $person = PeoplePopulation::updateOrCreate(
                        ['national_id' => $nationalIdMd5],
                        $data
                    );
                } else {
                    $data['national_id'] = null;
                    $person = PeoplePopulation::create($data);
                }

                $person->wasRecentlyCreated ? $importedCount++ : $updatedCount++;
            } catch (\Exception $e) {
                // ถ้า error บันทึก minimal แต่ยังบันทึก
                $skippedRows[] = [
                    'row_index' => $i,
                    'error' => $e->getMessage(),
                    'data' => $row
                ];
                $person = PeoplePopulation::create([
                    'first_name' => $firstName ?? 'ไม่ระบุ',
                    'last_name'  => $lastName ?? 'ไม่ระบุ',
                    'gender'     => $gender ?? 'OTHER',
                    'updated_at' => now()
                ]);
                $importedCount++;
                $skippedCount++;
            }
        }

        return response()->json([
            'success'        => true,
            'message'        => 'นำเข้าข้อมูลเสร็จสิ้น',
            'imported_count' => $importedCount,
            'updated_count'  => $updatedCount,
            'skipped_count'  => $skippedCount,
            'reportData'     => [
                'imported' => $importedCount,
                'updated'  => $updatedCount,
                'skipped'  => $skippedCount,
                'skipped_rows' => $skippedRows
            ]
        ]);
    }

    // Helper functions
    private function convertThaiDate($value)
    {
        if (!$value) return null;

        $thaiMonths = [
            "มกราคม" => 1,
            "กุมภาพันธ์" => 2,
            "มีนาคม" => 3,
            "เมษายน" => 4,
            "พฤษภาคม" => 5,
            "มิถุนายน" => 6,
            "กรกฎาคม" => 7,
            "สิงหาคม" => 8,
            "กันยายน" => 9,
            "ตุลาคม" => 10,
            "พฤศจิกายน" => 11,
            "ธันวาคม" => 12
        ];

        if ($value instanceof \DateTime) {
            return $value->format('Y-m-d');
        }

        $s = trim($value);

        // รูปแบบ 22-ธ.ค.-04
        if (preg_match('/(\d+)-([ก-๙]+)\.-(\d+)/', $s, $matches)) {
            $day = (int)$matches[1];
            $thaiMonth = $matches[2];
            $year = (int)$matches[3] + 2500; // แปลง พ.ศ. เป็น ค.ศ.

            $monthMap = [
                'ม.ค.' => 1,
                'ก.พ.' => 2,
                'มี.ค.' => 3,
                'เม.ย.' => 4,
                'พ.ค.' => 5,
                'มิ.ย.' => 6,
                'ก.ค.' => 7,
                'ส.ค.' => 8,
                'ก.ย.' => 9,
                'ต.ค.' => 10,
                'พ.ย.' => 11,
                'ธ.ค.' => 12
            ];

            $month = $monthMap[$thaiMonth . '.'] ?? null;
            if ($month && $day > 0 && $year > 0) {
                return sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }

        return null;
    }

    private function extractNumber($value)
    {
        if (!$value) return null;

        if (is_numeric($value)) {
            return (int)$value;
        }

        preg_match('/\d+/', (string)$value, $matches);
        return $matches ? (int)$matches[0] : null;
    }

    private function cleanCity($value)
    {
        if (!$value) return '';

        return trim(str_replace(
            ['ตำบล', 'อำเภอ', 'จังหวัด', 'แขวง', 'เขต'],
            '',
            (string)$value
        ));
    }
    private function normalizeGender($gender)
    {
        if (empty($gender)) {
            return 'OTHER';
        }

        $gender = trim($gender);
        $genderMap = [
            'ชาย' => 'M',
            'ชาย ' => 'M',
            'male' => 'M',
            'm' => 'M',
            '1' => 'M',
            'หญิง' => 'F',
            'หญิง ' => 'F',
            'female' => 'F',
            'f' => 'F',
            '2' => 'F',
        ];

        return $genderMap[strtolower($gender)] ?? 'OTHER';
    }
}
