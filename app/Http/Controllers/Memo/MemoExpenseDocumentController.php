<?php

namespace App\Http\Controllers\Memo;

use Inertia\Inertia;
use App\Models\WIN\PODT;
use App\Models\WIN\POHD;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
    public function apiIndex(Request $request)
    {
        $query = MemoExpenseDocuments::with('category');

        // ตรวจสอบว่าต้องการข้อมูลสรุปหรือไม่
        if ($request->has('summary') && $request->boolean('summary')) {
            return $this->getSummaryData($request);
        }

        // การค้นหา
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('document_no', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // กรองตามปี
        if ($request->has('year')) {
            $query->whereYear('date', $request->year);
        }

        // กรองตามเดือน
        if ($request->has('month') && !empty($request->month)) {
            [$year, $month] = explode('-', $request->month);
            $query->whereYear('date', $year)
                ->whereMonth('date', $month);
        }

        // กรองตามหมวดหมู่
        if ($request->has('category') && !empty($request->category)) {
            $query->where('category_id', $request->category);
        }

        // การเรียงลำดับ
        $sortField = $request->get('sort', 'id');
        $sortOrder = $request->get('order', 'desc');
        $query->orderBy($sortField, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 10);
        $documents = $query->paginate($perPage);

        // เพิ่มข้อมูล status และ total_amount จาก POHD และ GLHD
        $documents->getCollection()->transform(function ($doc) {
            $pohd = POHD::with(['poInv.glHeader'])
                ->where('POVendorNo', $doc->winspeed_ref_id)
                ->first();

            // เริ่มจากค่าเริ่มต้น
            $doc->status_label = 'ไม่ระบุ';
            $doc->total_amount = 0;

            if ($pohd) {
                // ดึงยอดรวมจาก GLHD ถ้ามี
                $doc->total_amount = $pohd->poInv?->glHeader?->TotaAmnt ?? 0;

                // ตรวจสอบสถานะ
                if (!empty($pohd->AppvDocuNo)) {
                    $doc->status = 'approved';
                    $doc->status_label = 'อนุมัติ';
                    $doc->AppvDocuNo = $pohd->AppvDocuNo;
                }
            }

            // ถ้าไม่มี AppvDocuNo ให้ดูจากสถานะของ Memo
            if ($doc->status === 'pending') {
                $doc->status_label = 'รอดำเนินการ';
            } elseif ($doc->status === 'rejected') {
                $doc->status_label = 'ปฏิเสธ';
            } elseif ($doc->status === 'draft') {
                $doc->status_label = 'ร่าง';
            } elseif ($doc->status === 'in_progress') {
                $doc->status_label = 'กำลังดำเนินการ';
            }

            return $doc;
        });

        $categories = MemoExpenseCategories::all();

        return response()->json([
            'categories' => $categories,
            'documents' => $documents
        ]);
    }

    // private function getSummaryData(Request $request)
    // {
    //     $currentYear = now()->year;

    //     // ดึงเอกสารทั้งหมดตามเงื่อนไขการกรอง
    //     $query = MemoExpenseDocuments::query();

    //     // กรองตามปี
    //     if ($request->has('year')) {
    //         $query->whereYear('date', $request->year);
    //     }

    //     // กรองตามเดือน
    //     if ($request->has('month') && !empty($request->month)) {
    //         [$year, $month] = explode('-', $request->month);
    //         $query->whereYear('date', $year)
    //             ->whereMonth('date', $month);
    //     }

    //     // กรองตามหมวดหมู่
    //     if ($request->has('category') && !empty($request->category)) {
    //         $query->where('category_id', $request->category);
    //     }

    //     $documents = $query->get();

    //     // คำนวณผลรวมจาก GLHD
    //     $yearAmount = 0;
    //     $monthAmount = 0;
    //     $categoryAmount = 0;
    //     $yearCount = 0;
    //     $monthCount = 0;
    //     $totalCount = 0;

    //     foreach ($documents as $doc) {
    //         $pohd = POHD::with(['poInv.glHeader'])
    //             ->where('POVendorNo', $doc->winspeed_ref_id)
    //             ->first();

    //         $totalAmount = 0;
    //         if ($pohd) {
    //             $totalAmount = $pohd->poInv?->glHeader?->TotaAmnt ?? 0;
    //         }

    //         // นับเอกสารปีปัจจุบัน
    //         $docYear = date('Y', strtotime($doc->date));
    //         if ($docYear == $currentYear) {
    //             $yearAmount += $totalAmount;
    //             $yearCount++;
    //         }

    //         // นับเอกสารเดือนที่เลือก
    //         if ($request->has('month') && !empty($request->month)) {
    //             [$selectedYear, $selectedMonth] = explode('-', $request->month);
    //             $docMonth = date('Y-m', strtotime($doc->date));
    //             if ($docMonth == $request->month) {
    //                 $monthAmount += $totalAmount;
    //                 $monthCount++;
    //             }
    //         } else {
    //             // ถ้าไม่ได้เลือกเดือนเฉพาะ ให้ใช้เดือนปัจจุบัน
    //             $currentMonth = date('Y-m');
    //             $docMonth = date('Y-m', strtotime($doc->date));
    //             if ($docMonth == $currentMonth) {
    //                 $monthAmount += $totalAmount;
    //                 $monthCount++;
    //             }
    //         }

    //         // ผลรวมตามหมวดหมู่ที่กรอง
    //         $categoryAmount += $totalAmount;
    //         $totalCount++;
    //     }

    //     // ถ้าไม่ได้เลือกเดือนเฉพาะ ให้คำนวณเดือนใหม่จากข้อมูลทั้งหมด
    //     if (!$request->has('month') || empty($request->month)) {
    //         $monthQuery = MemoExpenseDocuments::whereYear('date', $currentYear)
    //             ->whereMonth('date', now()->month);
    //         $monthCount = $monthQuery->count();

    //         // คำนวณยอดเงินเดือนใหม่จาก GLHD
    //         $monthDocuments = $monthQuery->get();
    //         $monthAmount = 0;
    //         foreach ($monthDocuments as $doc) {
    //             $pohd = POHD::with(['poInv.glHeader'])
    //                 ->where('POVendorNo', $doc->winspeed_ref_id)
    //                 ->first();
    //             if ($pohd) {
    //                 $monthAmount += $pohd->poInv?->glHeader?->TotaAmnt ?? 0;
    //             }
    //         }
    //     }

    //     // นับจำนวนตามหมวดหมู่
    //     $categoryCounts = [];
    //     if ($request->has('include_category_counts') && $request->boolean('include_category_counts')) {
    //         $countQuery = MemoExpenseDocuments::query();

    //         if ($request->has('month') && !empty($request->month)) {
    //             [$year, $month] = explode('-', $request->month);
    //             $countQuery->whereYear('date', $year)
    //                 ->whereMonth('date', $month);
    //         }

    //         $categoryCounts = $countQuery->select('category_id', DB::raw('COUNT(*) as count'))
    //             ->groupBy('category_id')
    //             ->pluck('count', 'category_id')
    //             ->toArray();
    //     }

    //     $categories = MemoExpenseCategories::all();

    //     return response()->json([
    //         'categories' => $categories,
    //         'summary' => [
    //             'yearAmount' => (float) $yearAmount,
    //             'yearCount' => $yearCount,
    //             'monthAmount' => (float) $monthAmount,
    //             'monthCount' => $monthCount,
    //             'categoryAmount' => (float) $categoryAmount,
    //             'totalCount' => $totalCount,
    //             'categoryCounts' => $categoryCounts
    //         ]
    //     ]);
    // }

     private function getSummaryData(Request $request)
    {
        $currentYear = now()->year;
        $selectedMonth = $request->month ?? now()->format('Y-m');
        $selectedCategory = $request->category;

        // 🔵 CARD 1: ผลรวมทั้งปี
        $yearDocuments = MemoExpenseDocuments::whereYear('date', $currentYear)->get();
        $yearSummary = $this->calculateTotalFromGLHD($yearDocuments);

        // 🟢 CARD 2: ผลรวมเดือนที่เลือก
        [$monthYear, $monthNum] = explode('-', $selectedMonth);
        $monthDocuments = MemoExpenseDocuments::whereYear('date', $monthYear)
            ->whereMonth('date', $monthNum)
            ->get();
        $monthSummary = $this->calculateTotalFromGLHD($monthDocuments);

        // 🟣 CARD 3: ผลรวมหมวดหมู่ที่เลือก + เดือนที่เลือก
        $categoryQuery = MemoExpenseDocuments::whereYear('date', $monthYear)
            ->whereMonth('date', $monthNum);

        if ($selectedCategory) {
            $categoryQuery->where('category_id', $selectedCategory);
        }

        $categoryDocuments = $categoryQuery->get();
        $categorySummary = $this->calculateTotalFromGLHD($categoryDocuments);

        // นับจำนวนตามหมวดหมู่สำหรับปุ่ม filter
        $categoryCounts = MemoExpenseDocuments::whereYear('date', $monthYear)
            ->whereMonth('date', $monthNum)
            ->select('category_id', DB::raw('COUNT(*) as count'))
            ->groupBy('category_id')
            ->pluck('count', 'category_id')
            ->toArray();

        $categories = MemoExpenseCategories::all();

        return response()->json([
            'categories' => $categories,
            'summary' => [
                'yearAmount' => (float) $yearSummary['totalAmount'],
                'yearCount' => $yearSummary['count'],
                'monthAmount' => (float) $monthSummary['totalAmount'],
                'monthCount' => $monthSummary['count'],
                'categoryAmount' => (float) $categorySummary['totalAmount'],
                'totalCount' => $categorySummary['count'],
                'categoryCounts' => $categoryCounts
            ]
        ]);
    }

    // Helper function สำหรับคำนวณผลรวมจาก GLHD
    private function calculateTotalFromGLHD($documents)
    {
        $winspeedRefIds = $documents->pluck('winspeed_ref_id')->filter()->toArray();

        if (empty($winspeedRefIds)) {
            return ['totalAmount' => 0, 'count' => 0];
        }

        $pohdData = POHD::with(['poInv.glHeader'])
            ->whereIn('POVendorNo', $winspeedRefIds)
            ->get()
            ->keyBy('POVendorNo');

        $totalAmount = 0;
        $count = 0;

        foreach ($documents as $doc) {
            $pohd = $pohdData[$doc->winspeed_ref_id] ?? null;
            $totalAmount += $pohd?->poInv?->glHeader?->TotaAmnt ?? 0;
            $count++;
        }

        return ['totalAmount' => $totalAmount, 'count' => $count];
    }

    public function show($ref_id)
    {
        $pohd = POHD::with(['poInv.glHeader'])->where('POVendorNo', $ref_id)->first();

        if (!$pohd) {
            return response()->json(['message' => 'ไม่พบข้อมูลใบสั่งซื้อในระบบ'], 404);
        }

        $podt = PODT::where('POID', $pohd->POID)->get();

        $memoDocument = MemoExpenseDocuments::with('category', 'attachments')
            ->where('winspeed_ref_id', $ref_id)
            ->first();

        // ✅ ดึงยอดรวมจาก GLHD ถ้ามี
        $totalAmount = $pohd->poInv?->glHeader?->TotalAmnt ?? 0;

        return response()->json([
            'winspeed_header' => $pohd,
            'winspeed_detail' => $podt,
            'memo_document' => $memoDocument,
            'total_amount' => $totalAmount, // ✅ เพิ่มตรงนี้
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
