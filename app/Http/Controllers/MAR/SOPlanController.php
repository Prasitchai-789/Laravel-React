<?php

namespace App\Http\Controllers\MAR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use App\Models\MAR\SOPlan;
use App\Models\Certificate;
use App\Models\VehicleInspection;
use App\Models\WIN\WebappEmp;

class SOPlanController extends Controller
{
    private function getEmployeeName($empIdOrName)
    {
        if (!$empIdOrName)
            return null;
        if (is_numeric($empIdOrName)) {
            $emp = WebappEmp::find($empIdOrName);
            if ($emp)
                return $emp->EmpName;
        }
        return $empIdOrName;
    }

    // ============================================================
    // INDEX — โหลดรายการแผนการขนส่ง (filter by year, memory-safe)
    // ============================================================
    public function index(Request $request)
    {
        // เพิ่ม memory limit เป็น safety net
        ini_set('memory_limit', '256M');

        // รับปีที่ต้องการ (default = ปีปัจจุบัน พ.ศ.)
        $selectedYear = (int) $request->get('year', date('Y'));

        // ดึงปีที่มีข้อมูล (สำหรับ dropdown)
        $availableYears = $this->getAvailableYears();

        // ดึงข้อมูล SOPlan โดย filter เฉพาะปีที่เลือก
        // SOPDate เก็บในรูปแบบ 'dd/mm/yyyy HH:ii:ss' → ปีอยู่ที่ตำแหน่ง 7-10
        $query = SOPlan::select(
            'SOPlan.SOPID',
            'SOPlan.SOPDate',
            'SOPlan.GoodID',
            'SOPlan.GoodName',
            'SOPlan.NumberCar',
            'SOPlan.DriverName',
            'SOPlan.CustID',
            'SOPlan.Recipient',
            'SOPlan.AmntLoad',
            'SOPlan.IBWei',
            'SOPlan.OBWei',
            'SOPlan.NetWei',
            'SOPlan.GoodPrice',
            'SOPlan.GoodAmnt',
            'SOPlan.Status',
            'SOPlan.ReceivedDate',
            'SOPlan.Remarks',
            'SOPlan.Status_coa',
            'c.CustName as CustName',
            'c.CustCode',
            DB::raw("
            -- ใช้ SOPDate โดยตรง เนื่องจากตอนนี้เป็น datetime2 แล้ว
            SOPDate as sort_date
        ")
        )
            ->leftJoin('EMCust as c', 'SOPlan.CustID', '=', 'c.CustID')
            // ======= กรองเฉพาะปีที่เลือก =======
            ->whereYear('SOPDate', $selectedYear)
            // TRY_CAST ป้องกัน SOPID ที่ไม่ใช่ตัวเลข เช่น '23 0'
            ->orderByRaw('ISNULL(TRY_CAST(SOPlan.SOPID AS INT), 0) DESC')
            ->orderBy('sort_date', 'desc');

        // ======= ใช้ cursor() แทน get() — ไม่โหลดทุก record เข้า RAM =======
        $mapped = [];
        $sopids = [];
        foreach ($query->cursor() as $s) {
            $name = strtolower(($s->GoodName ?? '') . ' ' . ($s->GoodID ?? ''));

            $type = 'other';
            if (str_contains($name, 'cpo') || str_contains($name, 'น้ำมันปาล์มดิบ') || str_contains($name, 'ปาล์มดิบ') || str_contains($name, 'น้ำมัน') || str_contains($name, 'oil')) {
                if (str_contains($name, 'บริสุทธิ์') || str_contains($name, 'rbd')) {
                    $type = 'palm-oil';
                } else {
                    $type = 'cpo';
                }
            } elseif (str_contains($name, 'เมล็ด') || str_contains($name, 'kernel') || str_contains($name, 'palm-kernel')) {
                $type = 'palm-kernel';
            } elseif (str_contains($name, 'กะลา') || str_contains($name, 'shell')) {
                $type = 'shell';
            } elseif (str_contains($name, 'ทะลาย') || str_contains($name, 'efb')) {
                $type = 'efb';
            } elseif (str_contains($name, 'ใย') || str_contains($name, 'fiber') || str_contains($name, 'palm-fiber')) {
                $type = 'fiber';
            }


            $sopids[] = $s->SOPID;
            $mapped[] = [
                'SOPID' => $s->SOPID,
                'SOPDate' => $s->SOPDate,
                'GoodID' => $s->GoodID,
                'GoodName' => $s->GoodName,
                'productType' => $type,
                'NumberCar' => $s->NumberCar,
                'DriverName' => $s->DriverName,
                'CustID' => $s->CustID,
                'CustCode' => $s->CustCode,
                'CustName' => $s->CustName,
                'Recipient' => $s->Recipient,
                'AmntLoad' => $s->AmntLoad,
                'IBWei' => $s->IBWei,
                'OBWei' => $s->OBWei,
                'NetWei' => $s->NetWei,
                'GoodPrice' => $s->GoodPrice,
                'GoodAmnt' => $s->GoodAmnt,
                'Status' => $s->Status,
                'ReceivedDate' => $s->ReceivedDate,
                'Remarks' => $s->Remarks,
                'Status_coa' => $s->Status_coa,
                'coa_number' => null,
                'is_inspected' => false,
            ];
        }

        // ดึง coa_number จากตาราง certificates (SOPID ใน certificates)
        if (!empty($sopids)) {
            $certs = [];
            $allCerts = Certificate::whereIn('SOPID', array_map('strval', $sopids))->get()->keyBy('SOPID');
            foreach ($mapped as &$item) {
                $cert = $allCerts->get((string)$item['SOPID']);
                $item['coa_number'] = $cert ? $cert->coa_number : null;
                $item['Status_coa'] = $cert ? $cert->status : ($item['Status_coa'] ?? 'w');
            }
            unset($item);
        }

        // ดึงข้อมูลการตรวจสอบรถ (is_inspected)
        if (!empty($sopids)) {
            $inspections = [];
            foreach (array_chunk($sopids, 1000) as $chunk) {
                $chunkResult = VehicleInspection::whereIn('sop_id', $chunk)->pluck('sop_id')->toArray();
                foreach ($chunkResult as $sopId) {
                    $inspections[(string) $sopId] = true;
                }
            }
            foreach ($mapped as &$item) {
                $item['is_inspected'] = isset($inspections[(string) $item['SOPID']]);
            }
            unset($item);
        }


        Log::info('📊 SOPlan index', ['year' => $selectedYear, 'count' => count($mapped)]);

        // ============ ดึงข้อมูล Dropdown จากทุกปี (ไม่กรองปี) ============
        $allProducts = DB::connection('sqlsrv2')
            ->select("
                SELECT DISTINCT GoodID, GoodName
                FROM SOPlan
                WHERE deleted_at IS NULL
                  AND GoodID IS NOT NULL
                  AND GoodName IS NOT NULL
                ORDER BY GoodName
            ");

        $allCustomers = DB::connection('sqlsrv2')
            ->select("
                SELECT DISTINCT s.CustID, c.CustName, c.CustCode
                FROM SOPlan s
                LEFT JOIN EMCust c ON s.CustID = c.CustID
                WHERE s.deleted_at IS NULL
                  AND s.CustID IS NOT NULL
                  AND c.CustName IS NOT NULL
                ORDER BY c.CustName
            ");

        $allDestinations = DB::connection('sqlsrv2')
            ->select("
                SELECT DISTINCT Recipient
                FROM SOPlan
                WHERE deleted_at IS NULL
                  AND Recipient IS NOT NULL
                  AND Recipient != ''
                ORDER BY Recipient
            ");

        $allVehicles = DB::connection('sqlsrv2')
            ->select("
                SELECT DISTINCT NumberCar, DriverName
                FROM SOPlan
                WHERE deleted_at IS NULL
                  AND NumberCar IS NOT NULL
                  AND NumberCar != ''
                ORDER BY NumberCar
            ");

        return Inertia::render('MAR/PlanOrder/indexPlanOrder', [
            'soplans' => $mapped,
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'allProducts' => array_map(fn($p) => ['goodID' => $p->GoodID, 'goodName' => $p->GoodName], $allProducts),
            'allCustomers' => array_map(fn($c) => ['custID' => $c->CustID, 'custName' => $c->CustName, 'custCode' => $c->CustCode ?? ''], $allCustomers),
            'allDestinations' => array_map(fn($d) => $d->Recipient, $allDestinations),
            'allVehicles' => array_map(fn($v) => ['numberCar' => $v->NumberCar, 'driverName' => $v->DriverName ?? ''], $allVehicles),
        ]);
    }

    // ============================================================
    // HELPER — ปีที่มีข้อมูลในระบบ
    // ============================================================
    private function getAvailableYears(): array
    {
        // ใช้ YEAR(SOPDate) ได้โดยตรงเนื่องจากฟิลด์เป็น datetime2 แล้ว
        $rows = DB::connection('sqlsrv2')
            ->select("
                SELECT DISTINCT YEAR(SOPDate) AS yr
                FROM SOPlan
                WHERE deleted_at IS NULL
                  AND SOPDate IS NOT NULL
                ORDER BY yr DESC
            ");

        $years = array_filter(
            array_map(fn($r) => (int) $r->yr, $rows),
            fn($y) => $y > 2000 // กรองค่า NULL (0) และปีที่ไม่สมเหตุสมผลออก
        );

        // fallback ถ้าไม่มีข้อมูล
        if (empty($years)) {
            $years = [(int) date('Y')];
        }

        return array_values($years);
    }

    public function show($id): JsonResponse
    {
        try {
            $s = SOPlan::leftJoin('EMCust as c', 'SOPlan.CustID', '=', 'c.CustID')
                ->where('SOPlan.SOPID', $id)
                ->select(
                    'SOPlan.*',
                    'c.CustName as CustName',
                    'c.CustCode'
                )
                ->first();

            if (!$s) {
                return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูล'], 404);
            }

            // Map product type (logic matches index)
            $name = strtolower(($s->GoodName ?? '') . ' ' . ($s->GoodID ?? ''));
            $type = 'other';
            if (str_contains($name, 'cpo') || str_contains($name, 'น้ำมันปาล์มดิบ') || str_contains($name, 'ปาล์มดิบ') || str_contains($name, 'น้ำมัน') || str_contains($name, 'oil')) {
                if (str_contains($name, 'บริสุทธิ์') || str_contains($name, 'rbd')) {
                    $type = 'palm-oil';
                } else {
                    $type = 'cpo';
                }
            } elseif (str_contains($name, 'เมล็ด') || str_contains($name, 'kernel') || str_contains($name, 'palm-kernel')) {
                $type = 'palm-kernel';
            }


            // Fetch certificate
            $cert = \App\Models\Certificate::where('SOPID', $id)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'SOPID' => $s->SOPID,
                    'SOPDate' => $s->SOPDate,
                    'GoodName' => $s->GoodName,
                    'productType' => $type,
                    'NumberCar' => $s->NumberCar,
                    'DriverName' => $s->DriverName,
                    'CustName' => $s->CustName,
                    'Recipient' => $s->Recipient,
                    'Status_coa' => $s->Status_coa,
                    // Certificate data
                    'coa_date' => $cert ? $cert->date_coa : null,
                    'coa_no' => $cert ? $cert->coa_number : null,
                    'coa_lot' => $cert ? $cert->coa_lot : null,
                    'ffa' => $cert ? $cert->result_FFA : null,
                    'm_i' => $cert ? $cert->result_moisture : null,
                    'iv' => $cert ? $cert->result_IV : null,
                    'dobi' => $cert ? $cert->result_dobi : null,
                    'result_shell' => $cert ? $cert->result_shell : null,
                    'result_kn_moisture' => $cert ? $cert->result_kn_moisture : null,
                    // Specs
                    'spec_ffa' => $cert ? $cert->spec_FFA : null,
                    'spec_moisture' => $cert ? $cert->spec_moisture : null,
                    'spec_iv' => $cert ? $cert->spec_IV : null,
                    'spec_dobi' => $cert ? $cert->spec_dobi : null,
                    'spec_shell' => $cert ? $cert->spec_shell : null,
                    'spec_kn_moisture' => $cert ? $cert->spec_kn_moisture : null,

                    'coa_tank' => $cert ? $cert->coa_tank : null,
                    'inspector' => $cert ? $this->getEmployeeName($cert->coa_user) : null,
                    'coa_user_id' => $cert ? $cert->coa_user : null,
                    'coa_mgr' => $cert ? $cert->coa_mgr : null,
                    'notes' => $cert ? $cert->coa_remark : null,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * ดึงข้อมูล SOPlan ที่รอตรวจ COA ตามประเภทสินค้า
     */
    public function pendingCOA(Request $request): JsonResponse
    {
        try {
            $type = $request->get('type'); // 'cpo' หรือ 'palm-kernel'
            $date = $request->get('date'); // optional YYYY-MM-DD
            $keyword = $request->get('q'); // search keyword

            $query = SOPlan::leftJoin('EMCust as c', 'SOPlan.CustID', '=', 'c.CustID')
                ->select(
                    'SOPlan.*',
                    'c.CustName as CustName',
                    'c.CustCode'
                );

            // กรองตามประเภทสินค้า (Logic เดียวกับ index)
            if ($type === 'cpo') {
                $query->where(function ($q) {
                    $q->where('GoodName', 'like', '%cpo%')
                        ->orWhere('GoodName', 'like', '%น้ำมันปาล์มดิบ%')
                        ->orWhere('GoodName', 'like', '%ปาล์มดิบ%')
                        ->orWhere(function($subq) {
                             $subq->where(function($s2) {
                                 $s2->where('GoodName', 'like', '%น้ำมัน%')
                                    ->orWhere('GoodName', 'like', '%oil%');
                             })->where('GoodName', 'not like', '%บริสุทธิ์%')
                               ->where('GoodName', 'not like', '%rbd%');
                        });
                });
            } elseif ($type === 'palm-kernel') {
                $query->where(function ($q) {
                    $q->where('GoodName', 'like', '%เมล็ด%')
                        ->orWhere('GoodName', 'like', '%kernel%')
                        ->orWhere('GoodName', 'like', '%palm-kernel%');
                });
            }

            // Search Keyword (ถ้ามีให้ค้นหาจากทุกที่และไม่จำกัดวันที่)
            if ($keyword) {
                $searchSopIds = \App\Models\Certificate::where('coa_number', 'like', "%{$keyword}%")
                    ->orWhere('coa_lot', 'like', "%{$keyword}%")
                    ->pluck('SOPID')
                    ->filter()
                    ->toArray();

                $query->where(function ($q) use ($keyword, $searchSopIds) {
                    $q->where('SOPlan.NumberCar', 'like', "%{$keyword}%")
                        ->orWhere('SOPlan.DriverName', 'like', "%{$keyword}%")
                        ->orWhere('SOPlan.Recipient', 'like', "%{$keyword}%")
                        ->orWhere('SOPlan.GoodName', 'like', "%{$keyword}%")
                        ->orWhere('SOPlan.SOPID', 'like', "%{$keyword}%")
                        ->orWhere('c.CustName', 'like', "%{$keyword}%");
                    
                    if (!empty($searchSopIds)) {
                        $realIds = array_filter($searchSopIds, fn($id) => !str_starts_with($id, 'P-'));
                        $synthIds = array_filter($searchSopIds, fn($id) => str_starts_with($id, 'P-'));

                        if (!empty($realIds)) {
                            $q->orWhereIn('SOPlan.SOPID', $realIds);
                        }

                        // สำหรับ synthetic IDs (P-YYYY-MM-DD-Cust-Good-Car-Amnt)
                        foreach ($synthIds as $sid) {
                            $parts = explode('-', $sid);
                            // Index 0=P, 1=Y, 2=M, 3=D, 4=CustID, 5=GoodID, Last=Amnt, middle=Car
                            if (count($parts) >= 8) {
                                $sDate = "{$parts[1]}-{$parts[2]}-{$parts[3]}";
                                $sCust = $parts[4];
                                $sGood = $parts[5];
                                $sAmnt = end($parts);
                                $sCar = implode('-', array_slice($parts, 6, count($parts) - 7));

                                $q->orWhere(function($sub) use ($sDate, $sCust, $sGood, $sCar) {
                                    $sub->whereDate('SOPlan.SOPDate', $sDate)
                                        ->where('SOPlan.CustID', $sCust)
                                        ->where('SOPlan.GoodID', $sGood)
                                        ->where('SOPlan.NumberCar', $sCar);
                                });
                            }
                        }
                    }
                });
            }

            // Logic กรองวันที่:
            // 1. ถ้าส่ง date มา -> กรองเทียบ SOPDate หรือ coa_date (จาก certificates)
            if ($date) {
                // ต้องดึง SOPIDs จาก certificates (sqlsrv3) มาก่อน เพราะอยู่คนละ connection กับ SOPlan (sqlsrv2)
                $certSopIds = \App\Models\Certificate::whereDate('date_coa', $date)
                    ->pluck('SOPID')
                    ->filter()
                    ->toArray();

                $query->where(function ($q) use ($date, $certSopIds) {
                    $q->whereDate("SOPDate", $date);
                    if (!empty($certSopIds)) {
                        $q->orWhereIn('SOPID', $certSopIds);
                    }
                });
            } elseif (!$keyword) {
                // ถ้าไม่มีทั้งวันที่และคำค้นหา ให้ใช้ Recent (60/30 วัน)
                $query->where(function ($q) {
                    $q->where(function($sub) {
                        $sub->whereDate("SOPDate", ">=", now()->subDays(60)->format('Y-m-d'))
                            ->where(function($s2) {
                                $s2->whereNull('Status_coa')
                                   ->orWhere('Status_coa', 'W');
                            });
                    })->orWhere(function($sub) {
                        $sub->whereDate("SOPDate", ">=", now()->subDays(30)->format('Y-m-d'))
                            ->where('Status_coa', 'A');
                    });
                });
            }

            $data = $query->orderBy("SOPDate", "DESC")->limit(500)->get();

            $sopids = $data->pluck('SOPID')->filter()->map('strval')->toArray();
            $certificates = !empty($sopids) 
                ? \App\Models\Certificate::whereIn('SOPID', $sopids)->get()->keyBy('SOPID')
                : collect();

            $now = now();
            $yearBE = $now->year + 543;
            $month = $now->format('m');
            $year2 = substr($yearBE, -2);
            
            // Get the current peak sequence for this year across ALL prefixes
            // coa_number format: [Prefix][XXXX]/[YearBE]
            $allCertsThisYear = \App\Models\Certificate::where('coa_number', 'like', "%/$yearBE")->pluck('coa_number');
            $maxSeq = 0;
            foreach ($allCertsThisYear as $coa) {
                // Extract digits after prefix but before the slash
                if (preg_match('/[A-Z]+(\d+)\/' . $yearBE . '/', $coa, $matches)) {
                    $seqVal = (int) $matches[1];
                    if ($seqVal > $maxSeq) $maxSeq = $seqVal;
                }
            }
            $nextSeq = $maxSeq + 1;

            $finalData = [];
            foreach ($data as $s) {
                $rowId = (string)$s->SOPID;
                $cert = $certificates->get($rowId);

                $finalData[] = [
                    'SOPID' => $rowId,
                    'SOPDate' => $s->SOPDate,
                    'GoodName' => $s->GoodName,
                    'productType' => $type,
                    'NumberCar' => $s->NumberCar,
                    'DriverName' => $s->DriverName,
                    'CustName' => $s->CustName,
                    'Recipient' => $s->Recipient,
                    'Status' => $s->Status,
                    'Status_coa' => $cert ? $cert->status : $s->Status_coa,
                    // Certificate data
                    'coa_date' => $cert ? $cert->date_coa : null,
                    'coa_no' => $cert ? $cert->coa_number : null,
                    'coa_lot' => $cert ? $cert->coa_lot : null,
                    'coa_tank' => $cert ? $cert->coa_tank : null,
                    'ffa' => $cert ? $cert->result_FFA : null,
                    'm_i' => $cert ? $cert->result_moisture : null,
                    'iv' => $cert ? $cert->result_IV : null,
                    'dobi' => $cert ? $cert->result_dobi : null,
                    'result_shell' => $cert ? $cert->result_shell : null,
                    'result_kn_moisture' => $cert ? $cert->result_kn_moisture : null,
                    // Specs
                    'spec_ffa' => $cert ? $cert->spec_FFA : null,
                    'spec_moisture' => $cert ? $cert->spec_moisture : null,
                    'spec_iv' => $cert ? $cert->spec_IV : null,
                    'spec_dobi' => $cert ? $cert->spec_dobi : null,
                    'spec_shell' => $cert ? $cert->spec_shell : null,
                    'spec_kn_moisture' => $cert ? $cert->spec_kn_moisture : null,
                    'inspector' => $cert ? $this->getEmployeeName($cert->coa_user) : null,
                    'coa_user_id' => $cert ? $cert->coa_user : null,
                    'coa_mgr' => $cert ? $cert->coa_mgr : null,
                    'notes' => $cert ? $cert->coa_remark : null,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $finalData
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ============================================================
    // STORE — บันทึกแผนใหม่
    // ============================================================
    public function store(Request $request)
    {
        Log::info('📥 SOPlan store request:', $request->all());

        $data = $request->validate([
            'receiveDate' => 'required|date',
            'goodID' => 'required|string',
            'goodName' => 'required|string',
            'loadPlan' => 'required|numeric',
            'custID' => 'required|string',
            'custCode' => 'nullable|string',
            'custName' => 'required|string',
            'destination' => 'required|string',
            'notes' => 'nullable|string',
            'vehicles' => 'array',
            'vehicles.*.numberCar' => 'nullable|string',
            'vehicles.*.driverName' => 'nullable|string',
        ]);

        $receiveDate = \Carbon\Carbon::parse($data['receiveDate'])->format('Y-m-d H:i:s');

        $savedPlans = [];

        // กรองข้อมูลรถที่มีค่า
        $validVehicles = array_values(array_filter(
            $data['vehicles'] ?? [],
            fn($v) => !empty($v['numberCar']) || !empty($v['driverName'])
        ));

        if (count($validVehicles) === 0) {
            return $this->errorResponse($request, 'กรุณาระบุข้อมูลรถอย่างน้อย 1 คัน', 422);
        }
        // ดึง SOPID สูงสุดที่เป็นตัวเลข (ข้ามค่าที่ไม่ใช่ตัวเลข)
        $maxIdStr = DB::connection('sqlsrv2')->selectOne("SELECT MAX(TRY_CAST(SOPID AS INT)) as max_id FROM SOPlan");
        $currentMaxId = $maxIdStr && $maxIdStr->max_id ? (int)$maxIdStr->max_id : 0;

        foreach ($validVehicles as $index => $vehicle) {
            $plan = new SOPlan();
            
            // สร้าง SOPID ใหม่ด้วยตัวเอง
            $currentMaxId++;
            $plan->SOPID = (string)$currentMaxId;
            

            $plan->SOPDate = $receiveDate;
            $plan->GoodID = $data['goodID'];
            $plan->GoodName = $data['goodName'];
            $plan->AmntLoad = $data['loadPlan'];
            $plan->CustID = $data['custID'];
            $plan->Recipient = $data['destination'];
            $plan->Status = 'w';

            $numberCar = $vehicle['numberCar'] ?? '';
            $driverName = $vehicle['driverName'] ?? '';

            // จัดการรถพ่วง (เช่น "82-0994สน / 68-4049กท")
            if (preg_match('/(.+?)\s*\/\s*(.+)/', $numberCar, $matches)) {
                $headTruck = trim($matches[1]);
                $trailer = trim($matches[2]);
                $plan->NumberCar = $headTruck;
                $remarks = $data['notes'] ?? '';
                $plan->Remarks = $remarks
                    ? $remarks . " (รถพ่วง: {$trailer})"
                    : "รถพ่วง: {$trailer}";
            } else {
                $plan->NumberCar = $numberCar;
                $plan->Remarks = $data['notes'] ?? null;
            }

            $plan->DriverName = $driverName;

            try {
                $plan->save();
                Log::info("🔹 SOPlan saved: SOPID=" . $plan->SOPID . " for Car=" . $plan->NumberCar);
                
                // ==========================================
                // สร้าง Certificate อัตโนมัติ (ตาม Logic เดิม)
                // ==========================================
                $now = now();
                $yearBE = $now->year + 543;
                $month = $now->format('m');
                $year2 = substr($yearBE, -2);
                
                $prefix = 'CPO';
                $gn = strtolower($plan->GoodName ?? '');
                if (str_contains($gn, 'เมล็ด') || str_contains($gn, 'kernel') || str_contains($gn, 'cpko')) {
                    $prefix = 'KN';
                }

                // หาลำดับ COA Number ของปีนี้
                $allCertsThisYear = \App\Models\Certificate::where('coa_number', 'like', "%/{$yearBE}")->pluck('coa_number');
                $certBaseSeq = 0;
                foreach ($allCertsThisYear as $coa) {
                    if (preg_match('/[A-Z]+(\d+)\/' . $yearBE . '/', $coa, $matches)) {
                        $seqVal = (int) $matches[1];
                        if ($seqVal > $certBaseSeq) $certBaseSeq = $seqVal;
                    }
                }
                $certBaseSeq++;
                $coaNumber = $prefix . str_pad($certBaseSeq, 4, '0', STR_PAD_LEFT) . "/{$yearBE}";
                $coaLot = 'QAC' . $year2 . $month . str_pad($certBaseSeq, 4, '0', STR_PAD_LEFT);

                $maxId = \App\Models\Certificate::max(\Illuminate\Support\Facades\DB::raw('TRY_CAST(id as INT)')) ?? 0;
                $certAutoIdSeq = (int)$maxId + 1;

                $certData = [
                    'id' => (string)$certAutoIdSeq,
                    'SOPID' => (string)$plan->SOPID,
                    'date_coa' => $now->format('Y-m-d H:i:s.v'),
                    'coa_number' => $coaNumber,
                    'coa_lot' => $coaLot,
                    'coa_tank' => '-',
                    'status' => 'pending',
                    'created_at' => $now->format('d/m/Y H:i:s'),
                    'updated_at' => $now->format('d/m/Y H:i:s'),
                ];

                if ($prefix === 'KN') {
                    $certData['spec_shell'] = '< 10.00 %';
                    $certData['spec_kn_moisture'] = '< 8.00 %';
                } else {
                    $certData['spec_FFA'] = '< 5.00 %';
                    $certData['spec_moisture'] = '< 0.50 %';
                    $certData['spec_IV'] = '50 - 55 %';
                    $certData['spec_dobi'] = '> 2.00';
                }

                \App\Models\Certificate::create($certData);
                Log::info("🔹 Certificate auto-created for SOPID=" . $plan->SOPID . " CoaNo=" . $coaNumber);
                // ==========================================

                $savedPlans[] = [
                    'SOPID' => (string)$plan->SOPID, 
                    'NumberCar' => $plan->NumberCar, 
                    'DriverName' => $plan->DriverName
                ];
            } catch (\Exception $e) {
                Log::error('❌ Error saving vehicle ' . ($index + 1) . ': ' . $e->getMessage());
                return $this->errorResponse(
                    $request,
                    'เกิดข้อผิดพลาดในการบันทึกข้อมูลรถคันที่ ' . ($index + 1) . ': ' . $e->getMessage(),
                    500
                );
            }
        }

        Log::info('✅ All vehicles saved', ['count' => count($savedPlans)]);

        // ย้ายการสร้าง COA ออกไปให้ Index หรือ Manual จัดการแทนตามเดิม

        $vehicleCount = count($savedPlans);
        $message = $vehicleCount > 1
            ? "บันทึกแผนการขนส่งเรียบร้อย {$vehicleCount} รายการ (SOPID: " . implode(', ', array_column($savedPlans, 'SOPID')) . ")"
            : "บันทึกแผนการขนส่งเรียบร้อย (SOPID: {$savedPlans[0]['SOPID']})";

        return redirect()->back()->with('success', $message);
    }

    // ============================================================
    // UPDATE — แก้ไขแผน
    // ============================================================
    public function update(Request $request, $id)
    {
        Log::info('📥 SOPlan update request:', ['id' => $id]);

        $data = $request->validate([
            'receiveDate' => 'required|date',
            'goodID' => 'required|string',
            'goodName' => 'required|string',
            'loadPlan' => 'required|numeric',
            'custID' => 'required|string',
            'custCode' => 'nullable|string',
            'custName' => 'required|string',
            'destination' => 'required|string',
            'notes' => 'nullable|string',
            'vehicles' => 'array',
            'vehicles.*.numberCar' => 'nullable|string',
            'vehicles.*.driverName' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $plan = SOPlan::where('SOPID', $id)->first();

            if (!$plan) {
                DB::rollBack();
                return $this->errorResponse($request, 'ไม่พบข้อมูลที่ต้องการแก้ไข (SOPID: ' . $id . ')', 404);
            }

            $receiveDate = \Carbon\Carbon::parse($data['receiveDate'])->format('Y-m-d H:i:s');

            $plan->SOPDate = $receiveDate;
            $plan->GoodID = $data['goodID'];
            $plan->GoodName = $data['goodName'];
            $plan->AmntLoad = $data['loadPlan'];
            $plan->CustID = $data['custID'];
            $plan->Recipient = $data['destination'];

            if (!empty($data['vehicles'])) {
                $vehicle = $data['vehicles'][0];
                $numberCar = $vehicle['numberCar'] ?? '';
                $driverName = $vehicle['driverName'] ?? '';

                if (preg_match('/(.+?)\s*\/\s*(.+)/', $numberCar, $matches)) {
                    $headTruck = trim($matches[1]);
                    $trailer = trim($matches[2]);
                    $plan->NumberCar = $headTruck;
                    $remarks = $data['notes'] ?? '';
                    $plan->Remarks = $remarks
                        ? $remarks . " (รถพ่วง: {$trailer})"
                        : "รถพ่วง: {$trailer}";
                } else {
                    $plan->NumberCar = $numberCar;
                    $plan->Remarks = $data['notes'] ?? null;
                }

                $plan->DriverName = $driverName;
            } else {
                $plan->NumberCar = null;
                $plan->DriverName = null;
                $plan->Remarks = $data['notes'] ?? null;
            }

            $plan->save();
            DB::commit();

            Log::info('✅ SOPlan updated', ['SOPID' => $id]);

            return redirect()->back()->with('success', 'แก้ไขข้อมูลเรียบร้อย (SOPID: ' . $id . ')');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Error updating SOPlan: ' . $e->getMessage());
            return $this->errorResponse($request, 'เกิดข้อผิดพลาดในการแก้ไข: ' . $e->getMessage(), 500);
        }
    }
    // ============================================================
    // UPDATE STATUS — เปลี่ยนเฉพาะสถานะ
    // ============================================================
    public function updateStatus(Request $request, $id)
    {
        Illuminate\Support\Facades\Log::info('📥 SOPlan update status request:', ['id' => $id, 'status' => $request->status]);

        $status = $request->status;

        try {
            $plan = SOPlan::where('SOPID', $id)->first();

            if (!$plan) {
                return $this->errorResponse($request, 'ไม่พบข้อมูลที่ต้องการเปลี่ยนสถานะ', 404);
            }

            $plan->Status = $status;
            $plan->save();

            Illuminate\Support\Facades\Log::info('✅ SOPlan status updated', ['SOPID' => $id, 'newStatus' => $status]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'เปลี่ยนสถานะเรียบร้อย (SOPID: ' . $id . ')',
                    'data' => ['SOPID' => $id, 'Status' => $plan->Status],
                ], 200);
            }

            return redirect()->back()->with('success', 'เปลี่ยนสถานะเรียบร้อย (SOPID: ' . $id . ')');

        } catch (\Exception $e) {
            Illuminate\Support\Facades\Log::error('❌ Error updating SOPlan status: ' . $e->getMessage());
            return $this->errorResponse($request, 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' . $e->getMessage(), 500);
        }
    }

    // ============================================================
    // DESTROY — Soft Delete (ตั้งค่า deleted_at แทนลบจริง)
    // ============================================================
    public function destroy(Request $request, $id)
    {
        Log::info('🗑️ SOPlan soft-delete request:', ['id' => $id]);

        $plan = SOPlan::where('SOPID', $id)->first();

        if (!$plan) {
            return $this->errorResponse($request, 'ไม่พบข้อมูลที่ต้องการลบ', 404);
        }

        try {
            // SoftDeletes trait จะ set deleted_at อัตโนมัติ — ไม่ลบจริง
            $plan->delete();

            Log::info('✅ SOPlan soft-deleted', ['SOPID' => $id]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'ลบข้อมูลเรียบร้อย (SOPID: ' . $id . ')',
                ], 200);
            }

            return redirect()->back()->with('success', 'ลบข้อมูลเรียบร้อย (SOPID: ' . $id . ')');

        } catch (\Exception $e) {
            Log::error('❌ Error soft-deleting SOPlan: ' . $e->getMessage());
            return $this->errorResponse($request, 'เกิดข้อผิดพลาดในการลบ', 500);
        }
    }

    // ============================================================
    // RESTORE — คืนค่า Soft Deleted record
    // ============================================================
    public function restore(Request $request, $id)
    {
        Log::info('🔄 SOPlan restore request:', ['id' => $id]);

        // ต้องใช้ withTrashed() เพื่อค้นหา record ที่ถูก soft-delete
        $plan = SOPlan::withTrashed()->where('SOPID', $id)->first();

        if (!$plan) {
            return $this->errorResponse($request, 'ไม่พบข้อมูลที่ต้องการกู้คืน', 404);
        }

        if (!$plan->trashed()) {
            return $this->errorResponse($request, 'ข้อมูลนี้ยังไม่ถูกลบ', 400);
        }

        try {
            $plan->restore();

            Log::info('✅ SOPlan restored', ['SOPID' => $id]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'กู้คืนข้อมูลเรียบร้อย (SOPID: ' . $id . ')',
                ], 200);
            }

            return redirect()->back()->with('success', 'กู้คืนข้อมูลเรียบร้อย (SOPID: ' . $id . ')');

        } catch (\Exception $e) {
            Log::error('❌ Error restoring SOPlan: ' . $e->getMessage());
            return $this->errorResponse($request, 'เกิดข้อผิดพลาดในการกู้คืน', 500);
        }
    }

    // ============================================================
    // FORCE DELETE — ลบถาวร (ใช้เฉพาะ admin)
    // ============================================================
    public function forceDelete(Request $request, $id)
    {
        Log::info('💀 SOPlan force-delete request:', ['id' => $id]);

        $plan = SOPlan::withTrashed()->where('SOPID', $id)->first();

        if (!$plan) {
            return $this->errorResponse($request, 'ไม่พบข้อมูลที่ต้องการลบถาวร', 404);
        }

        try {
            $plan->forceDelete();

            Log::info('✅ SOPlan force-deleted permanently', ['SOPID' => $id]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'ลบข้อมูลถาวรเรียบร้อย (SOPID: ' . $id . ')',
                ], 200);
            }

            return redirect()->back()->with('success', 'ลบข้อมูลถาวรเรียบร้อย (SOPID: ' . $id . ')');

        } catch (\Exception $e) {
            Log::error('❌ Error force-deleting SOPlan: ' . $e->getMessage());
            return $this->errorResponse($request, 'เกิดข้อผิดพลาดในการลบถาวร', 500);
        }
    }

    // ============================================================
    // HELPER
    // ============================================================
    private function errorResponse($request, $message, $status = 500)
    {
        if ($request->wantsJson()) {
            return response()->json(['success' => false, 'message' => $message], $status);
        }

        return redirect()->back()->with('error', $message);
    }

    // ============================================================
    // GENERATE COA — สร้างใบ Certificate / COA No. แบบ Manual
    // ============================================================
    public function generateCoa(Request $request, $id)
    {
        Log::info('📄 SOPlan generate COA request:', ['id' => $id]);

        try {
            $plan = SOPlan::where('SOPID', $id)->first();
            if (!$plan) {
                return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูลแผน (SOPID: ' . $id . ')'], 404);
            }

            // Check if certificate already exists
            $cert = \App\Models\Certificate::where('SOPID', $id)->first();
            if ($cert && $cert->coa_number && $cert->coa_number !== '-') {
                return response()->json(['success' => true, 'message' => 'มีเลข COA อยู่แล้ว', 'coa_no' => $cert->coa_number]);
            }

            $now = now();
            $yearBE = $now->year + 543;
            $month = $now->format('m');
            $year2 = substr($yearBE, -2);

            // Sequence logic (Base sequence for COA number)
            $allCertsThisYear = \App\Models\Certificate::where('coa_number', 'like', "%/{$yearBE}")->pluck('coa_number');
            $certBaseSeq = 0;
            foreach ($allCertsThisYear as $coa) {
                if (preg_match('/(\d+)\/' . $yearBE . '/', $coa, $matches)) {
                    $seqVal = (int) $matches[1];
                    if ($seqVal > $certBaseSeq) $certBaseSeq = $seqVal;
                }
            }
            $certBaseSeq++;

            $prefix = 'CPO';
            $gn = strtolower($plan->GoodName ?? '');
            if (str_contains($gn, 'เมล็ด') || str_contains($gn, 'kernel') || str_contains($gn, 'cpko')) {
                $prefix = 'KN';
            }

            $coaNumber = $prefix . str_pad($certBaseSeq, 4, '0', STR_PAD_LEFT) . "/{$yearBE}";
            $coaLot = 'QAC' . $year2 . $month . str_pad($certBaseSeq, 4, '0', STR_PAD_LEFT);

            if (!$cert) {
                $maxId = \App\Models\Certificate::max(\Illuminate\Support\Facades\DB::raw('TRY_CAST(id as INT)')) ?? 0;
                $certAutoIdSeq = (int)$maxId + 1;

                $certData = [
                    'id' => (string)$certAutoIdSeq,
                    'SOPID' => $id,
                    'date_coa' => $now->format('Y-m-d H:i:s.v'),
                    'coa_number' => $coaNumber,
                    'coa_lot' => $coaLot,
                    'coa_tank' => '-',
                    'status' => 'pending',
                    'created_at' => $now->format('d/m/Y H:i:s'),
                    'updated_at' => $now->format('d/m/Y H:i:s'),
                ];

                if ($prefix === 'KN') {
                    $certData['spec_shell'] = '< 10.00 %';
                    $certData['spec_kn_moisture'] = '< 8.00 %';
                } else {
                    $certData['spec_FFA'] = '< 5.00 %';
                    $certData['spec_moisture'] = '< 0.50 %';
                    $certData['spec_IV'] = '50 - 55 %';
                    $certData['spec_dobi'] = '> 2.00';
                }

                $cert = \App\Models\Certificate::create($certData);
            } else {
                $cert->coa_number = $coaNumber;
                if (!$cert->coa_lot || $cert->coa_lot === '-') {
                    $cert->coa_lot = $coaLot;
                }
                $cert->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'สร้างเลข COA เรียบร้อย',
                'coa_no' => $coaNumber,
                'coa_lot' => $coaLot
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error generating COA: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()], 500);
        }
    }
}
