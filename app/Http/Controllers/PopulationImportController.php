<?php

namespace App\Http\Controllers;

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

        $people = PeoplePopulation::orderBy('id', 'desc')
            ->paginate(50)
            ->through(fn($p) => [
                'id' => $p->id,
                'national_id' => $p->national_id,
                'name' => $p->title . ' ' . $p->first_name . ' ' . $p->last_name,
                'gender' => $p->gender,
                'village' => $p->village_name,
                'subdistrict' => $p->subdistrict_name,
                'district' => $p->district_name,
                'province' => $p->province_name,
            ]);
        return Inertia::render('Populations/components/PopulationsTable', [
            'people' => $people,
        ]);
    }

    public function import(Request $request)
    {
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '1024M');

        try {

            $rows = $request->input('rows', []);

            if (!is_array($rows) || empty($rows)) {
                return response()->json([
                    'success' => false,
                    'message' => 'NO DATA RECEIVED',
                ], 422);
            }

            $importData = [];
            $skipped    = [];

            // ดึงข้อมูลในฐานเพื่อใช้กันซ้ำ
            $existingIds = PeoplePopulation::pluck('national_id')->toArray();
            $existingNames = PeoplePopulation::select('first_name', 'last_name')
                ->get()
                ->map(fn($p) => strtolower($p->first_name . "|" . $p->last_name))
                ->toArray();

            foreach ($rows as $i => $row) {

                // ------------------------------
                // ❌ national_id ว่าง
                // ------------------------------
                if (empty($row['national_id'])) {
                    $skipped[] = [
                        'index' => $i,
                        'row'   => $row,
                        'cause' => 'เลขบัตรประชาชนว่าง',
                    ];
                    continue;
                }

                // ------------------------------
                // ❌ first_name หรือ last_name ว่าง
                // ------------------------------
                if (empty($row['first_name']) || empty($row['last_name'])) {
                    $skipped[] = [
                        'index' => $i,
                        'row'   => $row,
                        'cause' => 'ชื่อหรือสกุลว่าง',
                    ];
                    continue;
                }

                $fullName = strtolower($row['first_name'] . "|" . $row['last_name']);

                // ------------------------------
                // ❌เลขบัตรซ้ำในฐานข้อมูล
                // ------------------------------
                if (in_array($row['national_id'], $existingIds)) {
                    $skipped[] = [
                        'index' => $i,
                        'row'   => $row,
                        'cause' => 'เลขบัตรซ้ำ (มีอยู่แล้วในระบบ)',
                    ];
                    continue;
                }

                // ------------------------------
                // ❌ชื่อ–สกุลซ้ำในฐานข้อมูล
                // ------------------------------
                if (in_array($fullName, $existingNames)) {
                    $skipped[] = [
                        'index' => $i,
                        'row'   => $row,
                        'cause' => 'ชื่อ–สกุลซ้ำ (มีอยู่แล้วในระบบ)',
                    ];
                    continue;
                }

                // ------------------------------
                // Gender Normalization
                // ------------------------------
                $genderMap = [
                    'ชาย' => 'M',
                    'หญิง' => 'F',
                ];
                $gender = $genderMap[$row['gender']] ?? 'OTHER';

                // ------------------------------
                // เก็บข้อมูลสำหรับ bulk insert
                // ------------------------------
                $importData[] = [
                    'national_id'       => $row['national_id'],
                    'title'             => $row['prefix'],
                    'first_name'        => $row['first_name'],
                    'last_name'         => $row['last_name'],
                    'birthdate'         => $row['birthdate'],
                    'gender'            => $gender,
                    'house_no'          => $row['house_no'],
                    'village_no'        => $row['village_no'],
                    'village_name'      => $row['village_name'],
                    'subdistrict_name'  => $row['subdistrict_name'],
                    'district_name'     => $row['district_name'],
                    'province_name'     => $row['province_name'],
                    'religion'          => $row['religion'],
                    'age_at_import'     => $row['age_at_import'],
                    'phone'             => $row['phone'],
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ];

                // อัปเดตชุดข้อมูลกันซ้ำ
                $existingIds[]   = $row['national_id'];
                $existingNames[] = $fullName;
            }

            // ------------------------------
            // Bulk Insert (500 rows / batch)
            // ------------------------------
            $chunks = array_chunk($importData, 500);
            foreach ($chunks as $chunk) {
                PeoplePopulation::insert($chunk);
            }

            return response()->json([
                'success'        => true,
                'imported_count' => count($importData),
                'skipped_count'  => count($skipped),
                'imported_items' => $importData,  // ส่งกลับรายการที่สำเร็จ
                'skipped_items'  => $skipped,     // ส่งกลับรายการที่ไม่สำเร็จพร้อมเหตุผล
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => $e->getFile(),
            ], 500);
        }
    }
}
