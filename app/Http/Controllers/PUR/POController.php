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
    public function apiIndex(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month'); // อาจเป็น "" หรือ "2025-10"
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



    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
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
