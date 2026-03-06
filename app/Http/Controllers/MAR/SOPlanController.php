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
            if (str_contains($name, 'cpo') || str_contains($name, 'น้ำมันปาล์มดิบ') || str_contains($name, 'ปาล์มดิบ')) {
                $type = 'cpo';
            } elseif (str_contains($name, 'เมล็ด') || str_contains($name, 'kernel') || str_contains($name, 'palm-kernel')) {
                $type = 'palm-kernel';
            } elseif (str_contains($name, 'กะลา') || str_contains($name, 'shell')) {
                $type = 'shell';
            } elseif (str_contains($name, 'ทะลาย') || str_contains($name, 'efb')) {
                $type = 'efb';
            } elseif (str_contains($name, 'ใย') || str_contains($name, 'fiber') || str_contains($name, 'palm-fiber')) {
                $type = 'fiber';
            } elseif (str_contains($name, 'น้ำมัน') || str_contains($name, 'oil') || str_contains($name, 'palm-oil')) {
                $type = 'palm-oil';
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

        // ดึง coa_number จากตาราง certificates (อยู่คนละ connection, chunk เพื่อไม่เกิน 2100 params)
        if (!empty($sopids)) {
            $certs = [];
            foreach (array_chunk($sopids, 1000) as $chunk) {
                $chunkResult = Certificate::whereIn('SOPID', $chunk)->pluck('coa_number', 'SOPID');
                foreach ($chunkResult as $sopId => $coaNumber) {
                    $certs[(string) $sopId] = $coaNumber;
                }
            }
            foreach ($mapped as &$item) {
                $item['coa_number'] = $certs[(string) $item['SOPID']] ?? null;
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
            if (str_contains($name, 'cpo') || str_contains($name, 'น้ำมันปาล์มดิบ') || str_contains($name, 'ปาล์มดิบ')) {
                $type = 'cpo';
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
                        ->orWhere('GoodName', 'like', '%ปาล์มดิบ%');
                });
            } elseif ($type === 'palm-kernel') {
                $query->where(function ($q) {
                    $q->where('GoodName', 'like', '%เมล็ด%')
                        ->orWhere('GoodName', 'like', '%kernel%')
                        ->orWhere('GoodName', 'like', '%palm-kernel%');
                });
            }

            // ดึงข้อมูลย้อนหลัง 30 วัน
            $query->whereDate("SOPDate", ">=", now()->subDays(30)->format('Y-m-d'));

            $data = $query->orderBy("SOPDate", "DESC")->get();

            // Fetch related certificates
            $sopIds = $data->pluck('SOPID')->toArray();
            $certificates = \App\Models\Certificate::whereIn('SOPID', $sopIds)->get()->keyBy('SOPID');

            $now = now();
            $yearBE = $now->year + 543;
            $month = $now->format('m');
            $year2 = substr($yearBE, -2);
            $maxId = \App\Models\Certificate::max(\Illuminate\Support\Facades\DB::raw('TRY_CAST(id as INT)')) ?? 0;
            $certAutoIdSeq = (int) $maxId;

            // Pre-fetch all coa_numbers this year to prevent duplicate generation
            $allCertsThisYear = \App\Models\Certificate::where('coa_number', 'like', "%/{$yearBE}")->pluck('coa_number');
            $certBaseSeq = 0;
            foreach ($allCertsThisYear as $coa) {
                if (preg_match('/(\d+)\/' . $yearBE . '/', $coa, $matches)) {
                    $seqVal = (int) $matches[1];
                    if ($seqVal > $certBaseSeq) {
                        $certBaseSeq = $seqVal;
                    }
                }
            }

            $mapped = [];
            foreach ($data as $s) {
                $cert = $certificates->get($s->SOPID);

                if (!$cert || !$cert->coa_number || $cert->coa_number === '-') {
                    $prefix = 'CPO';
                    $gn = strtolower($s->GoodName ?? '');
                    if (str_contains($gn, 'เมล็ด') || str_contains($gn, 'kernel') || str_contains($gn, 'cpko')) {
                        $prefix = 'KN';
                    }

                    $certBaseSeq++;
                    $coaNumber = $prefix . str_pad($certBaseSeq, 4, '0', STR_PAD_LEFT) . "/{$yearBE}";
                    $coaLot = 'QAC' . $year2 . $month . str_pad($certBaseSeq, 4, '0', STR_PAD_LEFT);

                    if (!$cert) {
                        $certAutoIdSeq++;
                        $certData = [
                            'id' => (string) $certAutoIdSeq,
                            'SOPID' => $s->SOPID,
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
                        $certificates->put($s->SOPID, $cert);
                    } else {
                        $cert->coa_number = $coaNumber;
                        if (!$cert->coa_lot || $cert->coa_lot === '-') {
                            $cert->coa_lot = $coaLot;
                        }
                        $cert->save();
                    }
                }

                $mapped[] = [
                    'SOPID' => $s->SOPID,
                    'SOPDate' => $s->SOPDate,
                    'GoodName' => $s->GoodName,
                    'productType' => $type,
                    'NumberCar' => $s->NumberCar,
                    'DriverName' => $s->DriverName,
                    'CustName' => $s->CustName,
                    'Recipient' => $s->Recipient,
                    'Status' => $s->Status,
                    'Status_coa' => $s->Status_coa,
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
                'data' => $mapped
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

        foreach ($validVehicles as $index => $vehicle) {
            $plan = new SOPlan();
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
                // ✅ ดึง SOPID ที่ระบบ Auto-increment มาใช้
                $savedPlans[] = ['SOPID' => $plan->SOPID, 'NumberCar' => $plan->NumberCar, 'DriverName' => $plan->DriverName];
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

        // ============================================================
        // สร้างใบ Certificate อัตโนมัติหลังบันทึกแผน
        // ============================================================
        try {
            $now = now();
            $yearBE = $now->year + 543;
            $month = $now->format('m');
            $year2 = substr($yearBE, -2);

            // 1. Get Prefix
            $prefix = 'CPO';
            $gn = strtolower($data['goodName'] ?? '');
            if (str_contains($gn, 'เมล็ด') || str_contains($gn, 'kernel') || str_contains($gn, 'cpko')) {
                $prefix = 'KN';
            }

            // 2. Get Global sequence for coa_number (reset yearly)
            // Fetch all coa_numbers for this year and parse the max sequence in PHP to avoid TRY_CAST errors
            $allCertsThisYear = Certificate::where('coa_number', 'like', "%/{$yearBE}")->pluck('coa_number');
            $certBaseSeq = 0;
            foreach ($allCertsThisYear as $coa) {
                // Extract digits before the slash, ignoring any letter prefix (like CPO, KN, ISP_KN, etc)
                if (preg_match('/(\d+)\/' . $yearBE . '/', $coa, $matches)) {
                    $seqVal = (int) $matches[1];
                    if ($seqVal > $certBaseSeq) {
                        $certBaseSeq = $seqVal;
                    }
                }
            }

            // 3. Get Global max ID (nvarchar)
            $maxId = Certificate::max(DB::raw('TRY_CAST(id as INT)')) ?? 0;
            $idBaseSeq = (int) $maxId;

            foreach ($savedPlans as $idx => $planInfo) {
                $seq = $certBaseSeq + $idx + 1;
                $certId = (string) ($idBaseSeq + $idx + 1);

                $coaNumber = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT) . "/{$yearBE}";
                $coaLot = 'QAC' . $year2 . $month . str_pad($seq, 4, '0', STR_PAD_LEFT);

                $certData = [
                    'id' => $certId,
                    'SOPID' => $planInfo['SOPID'],
                    'date_coa' => $now->format('Y-m-d H:i:s.v'),
                    'coa_number' => $coaNumber,
                    'coa_lot' => $coaLot,
                    'coa_tank' => '-',
                    'status' => 'pending',
                    'created_at' => $now->format('d/m/Y H:i:s'),
                    'updated_at' => $now->format('d/m/Y H:i:s'),
                ];

                if ($prefix === 'KN') {
                    // เมล็ด: เฉพาะ Shell + KN Moisture
                    $certData['spec_shell'] = '< 10.00 %';
                    $certData['spec_kn_moisture'] = '< 8.00 %';
                } else {
                    // น้ำมัน: เฉพาะ FFA + M&I + IV + Dobi
                    $certData['spec_FFA'] = '< 5.00 %';
                    $certData['spec_moisture'] = '< 0.50 %';
                    $certData['spec_IV'] = '50 - 55 %';
                    $certData['spec_dobi'] = '> 2.00';
                }

                Certificate::create($certData);
            }
        } catch (\Exception $e) {
            Log::error('❌ Error creating automatic certificates: ' . $e->getMessage());
            // ไม่ขัดจังหวะการบันทึกแผนหลัก แต่ Log ไว้
        }

        $vehicleCount = count($savedPlans);
        $message = $vehicleCount > 1
            ? "บันทึกแผนการขนส่งเรียบร้อย {$vehicleCount} รายการ (SOPID: " . implode(', ', array_column($savedPlans, 'SOPID')) . ")"
            : "บันทึกแผนการขนส่งเรียบร้อย (SOPID: {$savedPlans[0]['SOPID']})";

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $message, 'data' => $savedPlans], 201);
        }

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

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'แก้ไขข้อมูลเรียบร้อย (SOPID: ' . $id . ')',
                    'data' => ['SOPID' => $id, 'NumberCar' => $plan->NumberCar, 'DriverName' => $plan->DriverName, 'Status' => $plan->Status],
                ], 200);
            }

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
}
