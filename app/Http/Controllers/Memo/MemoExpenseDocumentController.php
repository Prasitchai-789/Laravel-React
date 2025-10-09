<?php

namespace App\Http\Controllers\Memo;

use Inertia\Inertia;
use App\Models\WIN\PODT;
use App\Models\WIN\POHD;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Models\Memo\MemoExpenseDocuments;
use App\Models\Memo\MemoExpenseCategories;

class MemoExpenseDocumentController extends Controller
{
    public function index()
    {
        return Inertia::render('Memo/Index', []);
    }
    public function apiIndex()
    {
        $categories = MemoExpenseCategories::all();

        // ดึงเอกสารทั้งหมด
        $documents = MemoExpenseDocuments::with('category', 'attachments')
            ->get()
            ->map(function ($doc) {
                // ดึงข้อมูล Winspeed Header ที่อ้างถึง (ถ้ามี)
                $pohd = POHD::where('POVendorNo', $doc->winspeed_ref_id)->first();

                // ตรวจสอบสถานะจาก AppvDocuNo
                if ($pohd && !empty($pohd->AppvDocuNo)) {
                    $doc->status = 'approved';
                    $doc->status_label = 'อนุมัติ';
                    $doc->AppvDocuNo = $pohd->AppvDocuNo;
                } elseif ($doc->status === 'pending') {
                    $doc->status_label = 'รอดำเนินการ';
                } elseif ($doc->status === 'rejected') {
                    $doc->status_label = 'ปฏิเสธ';
                } elseif ($doc->status === 'draft') {
                    $doc->status_label = 'ร่าง';
                } elseif ($doc->status === 'in_progress') {
                    $doc->status_label = 'กำลังดำเนินการ';
                } else {
                    $doc->status_label = 'ไม่ระบุ';
                }

                return $doc;
            });

        return response()->json([
            'categories' => $categories,
            'documents' => $documents,
        ]);
    }


    public function show($ref_id)
    {
        // ดึง Header (POHD)
        $pohd = POHD::where('POVendorNo', $ref_id)->first();

        if (!$pohd) {
            return response()->json([
                'message' => 'ไม่พบข้อมูลใบสั่งซื้อในระบบ',
            ], 404);
        }
        // ดึง Detail (PODT)
        $podt = PODT::where('POID', $pohd->POID)->get();

        // ดึงข้อมูลเอกสาร Memo
        $memoDocument = MemoExpenseDocuments::with('category', 'attachments')
            ->where('winspeed_ref_id', $ref_id)
            ->first();

        if (!$memoDocument) {
            return response()->json([
                'message' => 'ไม่พบข้อมูลเอกสารในระบบ',
            ], 404);
        }

        if (!empty($pohd->AppvDocuNo)) {
            $memoDocument->status = 'approved';
            $memoDocument->status_label = 'อนุมัติ';
        } elseif ($memoDocument->status === 'pending') {
            $memoDocument->status_label = 'รอดำเนินการ';
        } elseif ($memoDocument->status === 'rejected') {
            $memoDocument->status_label = 'ปฏิเสธ';
        } else {
            $memoDocument->status_label = 'ไม่ระบุ';
        }

        // ส่งข้อมูลกลับให้ React
        return response()->json([
            'winspeed_header' => $pohd,
            'winspeed_detail' => $podt,
            'memo_document' => $memoDocument,
        ]);
    }




    public function create()
    {
        $categories = MemoExpenseCategories::all();
        return response()->json($categories); // ส่งข้อมูลไป React
    }

    // บันทึกเอกสาร
    public function store(Request $request)
    {
        $request->validate([
            'document_no' => 'required|unique:memo_expense_documents,document_no',
            'date' => 'required|date',
            'category_id' => 'required|exists:memo_expense_categories,id',
            'amount' => 'nullable|numeric',
            // 'status' => 'nullable|string',
            'description' => 'nullable|string',
            'winspeed_ref_id' => 'nullable|string',
            'attachment_path' => 'nullable|file|max:5120', // สูงสุด 5MB
        ]);

        $path = null;
        if ($request->hasFile('attachment_path')) {
            $path = $request->file('attachment_path')->store('attachment', 'public');
        }

        $document = MemoExpenseDocuments::create([
            'document_no' => $request->document_no,
            'date' => $request->date,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            // 'status' => $request->status ?? 'pending',
            'attachment_path' => $path,
            'winspeed_ref_id' => $request->winspeed_ref_id,
        ]);

        return redirect()->back()->with('success', 'สร้างรายการขายเรียบร้อยแล้ว');
    }
    public function update(Request $request, $id)
    {
        $document = MemoExpenseDocuments::findOrFail($id);

        $request->validate([
            'document_no' => 'required|unique:memo_expense_documents,document_no,' . $document->id,
            'date' => 'required|date',
            'category_id' => 'required|exists:memo_expense_categories,id',
            'amount' => 'nullable|numeric',
            // 'status' => 'nullable|string',
            'description' => 'nullable|string',
            'winspeed_ref_id' => 'nullable|string',
            'attachment_path' => 'nullable|file|max:5120', // สูงสุด 5MB
        ]);

        if ($request->hasFile('attachment_path')) {
            // ลบไฟล์เก่าถ้ามี
            if ($document->attachment_path) {
                Storage::disk('public')->delete($document->attachment_path);
            }
            $path = $request->file('attachment_path')->store('attachment', 'public');
            $document->attachment_path = $path;
        }

        $document->update([
            'document_no' => $request->document_no,
            'date' => $request->date,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            // 'status' => $request->status ?? $document->status,
            'winspeed_ref_id' => $request->winspeed_ref_id,
        ]);

        return redirect()->back()->with('success', 'อัปเดตรายการขายเรียบร้อยแล้ว');
    }


    public function destroy($id)
    {
        $document = MemoExpenseDocuments::findOrFail($id);
        if ($document->attachment_path) {
            Storage::disk('public')->delete($document->attachment_path);
        }
        MemoExpenseDocuments::destroy($id);
        return redirect()->back()->with('success', 'ลบเอกสารเรียบร้อยแล้ว');
    }
}
