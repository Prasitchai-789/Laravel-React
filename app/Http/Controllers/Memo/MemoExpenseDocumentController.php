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
        $categories = MemoExpenseCategories::all();
        $documents = MemoExpenseDocuments::with('category', 'attachments')->get();
        $winspeed = POHD::where('DocuNo', 'POR6807-00066')->get();
        $result = $winspeed[0]->POID;
        $podt = PODT::where('POID', $result)->get();
        return Inertia::render('Memo/Index', [
            'categories' => $categories,
            'documents' => $documents,
        ]);
    }
    public function apiIndex()
    {
        $categories = MemoExpenseCategories::all();
        $documents = MemoExpenseDocuments::with('category', 'attachments')->get();
        // $documents = 1;
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
            'status' => 'nullable|string',
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
            'status' => $request->status ?? 'pending',
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
            'status' => 'nullable|string',
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
            'status' => $request->status ?? $document->status,
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
