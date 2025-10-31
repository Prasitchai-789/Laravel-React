<?php

namespace App\Http\Controllers\PUR;

use Inertia\Inertia;
use App\Models\WIN\POHD;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\WIN\EMDept;

class POController extends Controller
{
    public function index()
    {
        return Inertia::render('PUR/PO/Index', []);
    }
    public function expenseByDept()
    {
        return Inertia::render('PUR/PO/ExpenseByDept', []);
    }
    public function apiIndex(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month');
        $deptId = $request->input('dept_id', '1006');

        // รับ pagination parameters จาก frontend
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);

        // ===== รายชื่อฝ่าย =====
        $depts = EMDept::select('DeptID', 'DeptName')->get();

        // ===== ดึงข้อมูลหลักตามเงื่อนไข =====
        $query = POHD::on('sqlsrv2')
            ->with(['poInv.glHeader', 'department'])
            ->where('DeptID', $deptId)
            ->whereYear('DocuDate', $year)
            ->where('POHD.DocuType', 305)
            ->whereNotNull('POVendorNo')
            ->whereNotNull('RefDocuNo')
            ->whereNotNull('AppvDocuNo')
            ->orderBy('DocuDate', 'desc')
            ->orderBy('POID', 'desc');

        // ===== เงื่อนไขเดือน (ถ้ามี) =====
        if (!empty($month)) {
            $monthNum = (int)substr($month, 5, 2);
            $query->whereMonth('DocuDate', $monthNum);
        }

        // ===== ดึงข้อมูลแบบแบ่งหน้า =====
        $data = $query->paginate($perPage, ['*'], 'page', $page);

        // ===== แปลงข้อมูลก่อนส่งออก =====
        $mapped = $data->getCollection()
            ->filter(
                fn($po) =>
                !empty($po->POVendorNo) &&
                    !empty($po->RefDocuNo) &&
                    !empty($po->AppvDocuNo)
            )
            ->map(function ($po) {
                return [
                    'POID'         => $po->POID,
                    'DocuDate'     => $po->DocuDate,
                    'DeptName'     => $po->department?->DeptName,
                    'POVendorNo'   => $po->POVendorNo,
                    'RefDocuNo'    => $po->RefDocuNo,
                    'AppvDocuNo'   => $po->AppvDocuNo,
                    'status'       => !empty($po->AppvDocuNo) ? 'approved' : 'pending',
                    'status_label' => !empty($po->AppvDocuNo) ? 'อนุมัติ' : 'รอดำเนินการ',
                    'total_amount' => $po->poInv?->glHeader?->TotaAmnt ?? null,
                ];
            });

        // อัปเดต Collection หลัง filter แล้ว
        $data->setCollection($mapped->values());

        // ===== คำนวณผลรวมทั้งปีของฝ่าย =====
        $yearQuery = POHD::on('sqlsrv2')
            ->with(['poInv.glHeader'])
            ->where('DeptID', $deptId)
            ->whereYear('DocuDate', $year)
            ->whereNotNull('POVendorNo')
            ->whereNotNull('RefDocuNo')
            ->whereNotNull('AppvDocuNo');

        $yearCount = $yearQuery->count();
        $yearTotal = $yearQuery->get()->sum(fn($po) => $po->poInv?->glHeader?->TotaAmnt ?? 0);

        // ===== คำนวณผลรวมเดือนที่เลือก (ถ้ามี) =====
        $monthQuery = POHD::on('sqlsrv2')
            ->with(['poInv.glHeader'])
            ->where('DeptID', $deptId)
            ->whereYear('DocuDate', $year)
            ->whereNotNull('POVendorNo')
            ->whereNotNull('RefDocuNo')
            ->whereNotNull('AppvDocuNo');

        if (!empty($month)) {
            $monthNum = (int)substr($month, 5, 2);
            $monthQuery->whereMonth('DocuDate', $monthNum);
        }

        $monthCount = $monthQuery->count();
        $monthTotal = $monthQuery->get()->sum(fn($po) => $po->poInv?->glHeader?->TotaAmnt ?? 0);

        // ===== ส่ง response =====
        return response()->json([
            'poDocs' => [
                'data'          => $data->items(),
                'total'         => $data->total(),
                'current_page'  => $data->currentPage(),
                'per_page'      => $data->perPage(),
                'last_page'     => $data->lastPage(),
            ],
            'depts' => $depts,
            'summary' => [
                'year'  => ['count' => $yearCount,  'total' => $yearTotal],
                'month' => ['count' => $monthCount, 'total' => $monthTotal],
            ],
        ]);
    }


    public function apiChart(Request $request)
    {
        $year   = $request->input('year', date('Y'));
        $month  = $request->input('month');
        $deptId = $request->input('dept_id');

        // สร้าง base query สำหรับทั้ง byDept และ yearlyTotal
        $baseQuery = POHD::on('sqlsrv2')
            ->join('EMDept', 'POHD.DeptID', '=', 'EMDept.DeptID')
            ->join('POInvHD', 'POHD.AppvDocuNo', '=', 'POInvHD.PONo')
            ->join('GLHD', 'POInvHD.DocuNo', '=', 'GLHD.DocuNo')
            ->whereYear('POHD.DocuDate', $year)
            ->whereNotNull('POHD.POVendorNo')
            ->whereNotNull('RefDocuNo')
            ->where('POHD.DocuType', 305);

        // ถ้ามีเดือน
        if (!empty($month)) {
            $monthNum = (int) $month; // แปลง string เป็น integer
            if ($monthNum >= 1 && $monthNum <= 12) {
                $baseQuery->whereMonth('POInvHD.DocuDate', $monthNum);
            }
        }

        // ข้อมูลแยกตามหน่วยงาน
        $byDept = (clone $baseQuery)
            ->selectRaw('EMDept.DeptID, EMDept.DeptName, SUM(GLHD.TotaAmnt) as total')
            ->groupBy('EMDept.DeptID', 'EMDept.DeptName')
            ->orderBy('EMDept.DeptName')
            ->get();

        // ผลรวมทั้งปี / ผลรวมตามเงื่อนไขเดียวกับ byDept
        $yearlyTotal = $byDept->sum(fn($d) => $d->total);

        // ข้อมูลแยกเดือนสำหรับ dept เฉพาะ
        $byMonth = collect();
        if (!empty($deptId)) {
            $byMonth = POHD::on('sqlsrv2')
                ->join('POInvHD', 'POHD.AppvDocuNo', '=', 'POInvHD.PONo')
                ->join('GLHD', 'POInvHD.DocuNo', '=', 'GLHD.DocuNo')
                ->selectRaw('MONTH(POHD.DocuDate) as month, SUM(GLHD.TotaAmnt) as total')
                ->where('POHD.DeptID', $deptId)
                ->whereYear('POHD.DocuDate', $year)
                ->whereNotNull('POHD.POVendorNo')
                ->groupByRaw('MONTH(POHD.DocuDate)')
                ->orderByRaw('MONTH(POHD.DocuDate)')
                ->get();
        }

        return response()->json([
            'byDept'      => $byDept,
            'byMonth'     => $byMonth,
            'yearlyTotal' => $yearlyTotal,
        ]);
    }


    public function apiPOinvChart(Request $request)
    {
        $year   = $request->input('year', date('Y'));
        $month  = $request->input('month');   // ถ้า null = ทั้งปี
        $deptId = $request->input('dept_id'); // กรองแผนกถ้ามี
        $branchId = $request->input('brchid'); // กรองสาขา

        // Base query สำหรับ POInvHD
        $baseQuery = DB::connection('sqlsrv2')
            ->table('POInvHD')
            ->join('EMDept', 'POInvHD.DeptID', '=', 'EMDept.DeptID')
            ->where('POInvHD.DocuType', 309)
            ->where('POInvHD.MultiCurr', 'N')
            ->whereYear('POInvHD.DocuDate', $year);

        if (!empty($month)) {
            [$y, $m] = explode('-', $month);
            $baseQuery->whereYear('POInvHD.DocuDate', (int)$y)
                ->whereMonth('POInvHD.DocuDate', (int)$m);
        } else {
            $baseQuery->whereYear('POInvHD.DocuDate', (int)$year);
        }

        if (!empty($branchId)) {
            $baseQuery->where('POInvHD.BrchID', $branchId);
        }

        // ข้อมูลรวมต่อแผนก
        $byDept = (clone $baseQuery)
            ->select(
                'POInvHD.DeptID',
                'EMDept.DeptName',
                DB::raw('SUM(POInvHD.TotaBaseAmnt) as totalBase'),
                DB::raw('SUM(POInvHD.BillDiscAmnt) as totalBillDiscount'),
                DB::raw('SUM(POInvHD.AdvnAmnt) as totalAdvance'),
                DB::raw('SUM(POInvHD.VATAmnt) as totalVAT'),
                DB::raw('SUM(POInvHD.NetAmnt) as totalNet')
            )
            ->groupBy('POInvHD.DeptID', 'EMDept.DeptName')
            ->orderBy('EMDept.DeptName')
            ->get();

        // ผลรวมทั้งปี / เงื่อนไขเดียวกับ byDept
        $yearlyTotal = [
            'totalBase'       => $byDept->sum(fn($d) => $d->totalBase),
            'totalBillDiscount' => $byDept->sum(fn($d) => $d->totalBillDiscount),
            'totalAdvance'    => $byDept->sum(fn($d) => $d->totalAdvance),
            'totalVAT'        => $byDept->sum(fn($d) => $d->totalVAT),
            'totalNet'        => $byDept->sum(fn($d) => $d->totalNet),
        ];

        // ข้อมูลต่อเดือน สำหรับแผนกเฉพาะ
        $byMonth = collect();
        if (!empty($deptId)) {
            $byMonth = DB::connection('sqlsrv2')
                ->table('POInvHD')
                ->select(
                    DB::raw('MONTH(DocuDate) as month'),
                    DB::raw('SUM(TotaBaseAmnt) as totalBase'),
                    DB::raw('SUM(BillDiscAmnt) as totalBillDiscount'),
                    DB::raw('SUM(AdvnAmnt) as totalAdvance'),
                    DB::raw('SUM(VATAmnt) as totalVAT'),
                    DB::raw('SUM(NetAmnt) as totalNet')
                )
                ->where('DeptID', $deptId)
                ->whereYear('DocuDate', $year)
                ->groupByRaw('MONTH(DocuDate)')
                ->orderByRaw('MONTH(DocuDate)')
                ->get();
        }

        return response()->json([
            'byDept'      => $byDept,
            'byMonth'     => $byMonth,
            'yearlyTotal' => $yearlyTotal,
        ]);
    }



    public function store(Request $request)
    {
        //
    }

    public function show($id)
    {
        $po = POHD::on('sqlsrv2')
            ->with(['poInv.glHeader', 'department'])
            ->where('POID', $id)
            ->firstOrFail();
        // แปลงข้อมูลที่ต้องการ
        $result = [
            'POID' => $po->POID,
            'DocuDate' => $po->DocuDate,
            'DeptName' => $po->department?->DeptName,
            'POVendorNo' => $po->POVendorNo,
            'AppvDocuNo' => $po->AppvDocuNo,
            'status' => !empty($po->AppvDocuNo) ? 'approved' : 'pending',
            'status_label' => !empty($po->AppvDocuNo) ? 'อนุมัติ' : 'รอดำเนินการ',
            'total_amount' => $po->poInv?->glHeader?->TotaAmnt ?? 0,
            'details' => $po->details
        ];

        return response()->json([
            'po' => $result
        ]);
    }


    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
