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

        // รายชื่อฝ่าย
        $depts = EMDept::select('DeptID', 'DeptName')->get();

        // ===== ดึงข้อมูลหลักตามเงื่อนไข =====
        $query = POHD::on('sqlsrv2')
            ->with(['poInv.glHeader', 'department'])
            ->where('DeptID', $deptId)
            ->whereYear('DocuDate', $year)
            ->whereNotNull('POVendorNo');

        // ถ้ามีการเลือกเดือน -> กรองเฉพาะเดือนนั้น
        if (!empty($month)) {
            $monthNum = (int)substr($month, 5, 2);
            $query->whereMonth('DocuDate', $monthNum);
        }

        // ดึงข้อมูลแบบแบ่งหน้า
        $data = $query->paginate(50);

        // แปลงข้อมูลก่อนส่งออก
        $mapped = $data->getCollection()->map(function ($po) {
            return [
                'POID'         => $po->POID,
                'DocuDate'     => $po->DocuDate,
                'DeptName'     => $po->department?->DeptName,
                'POVendorNo'   => $po->POVendorNo,
                'AppvDocuNo'   => $po->AppvDocuNo,
                'status'       => !empty($po->AppvDocuNo) ? 'approved' : 'pending',
                'status_label' => !empty($po->AppvDocuNo) ? 'อนุมัติ' : 'รอดำเนินการ',
                'total_amount' => $po->poInv?->glHeader?->TotaAmnt ?? 0,
            ];
        });
        $data->setCollection($mapped);

        // ===== คำนวณผลรวมทั้งปีของฝ่าย =====
        $yearDocs = POHD::on('sqlsrv2')
            ->with(['poInv.glHeader'])
            ->where('DeptID', $deptId)
            ->whereYear('DocuDate', $year)
            ->whereNotNull('POVendorNo')
            ->get();

        $yearCount = $yearDocs->count();
        $yearTotal = $yearDocs->sum(fn($po) => $po->poInv?->glHeader?->TotaAmnt ?? 0);

        // ===== คำนวณผลรวมเดือนที่เลือก (ถ้ามี) =====
        if (!empty($month)) {
            $monthDocs = $yearDocs->filter(function ($po) use ($month) {
                return date('Y-m', strtotime($po->DocuDate)) === $month;
            });
        } else {
            $monthDocs = collect(); // ถ้าไม่เลือกเดือน
        }

        $monthCount = $monthDocs->count();
        $monthTotal = $monthDocs->sum(fn($po) => $po->poInv?->glHeader?->TotaAmnt ?? 0);


        // ===== ส่ง response =====
        return response()->json([
            'poDocs'  => $data,
            'depts'   => $depts,
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
            ->whereNotNull('POHD.POVendorNo');

        // ถ้ามีเดือน
        if (!empty($month)) {
            $monthNum = (int) substr($month, 5, 2);
            $baseQuery->whereMonth('POHD.DocuDate', $monthNum);
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
