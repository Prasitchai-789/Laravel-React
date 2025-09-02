<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\DailyChemical;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

use App\Exports\ChemicalsMonthlyExport;
use Maatwebsite\Excel\Collections\SheetCollection;

class ChemicalController extends Controller
{
    // แสดงรายการทั้งหมดในรูปแบบ Daily Chemicals
    public function index()
    {
        // ดึงข้อมูลทั้งหมด เรียงจากใหม่สุดไปเก่าสุด
        $raw = DailyChemical::orderBy('date', 'desc')
            ->orderBy('shift', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group ตาม date+shift
        $grouped = $raw->groupBy(fn($item) => $item->date . '_' . $item->shift)
            ->map(function ($group) {
                $records = $group->map(fn($item) => [
                    'id' => $item->id,
                    'chemical_name' => $item->chemical_name,
                    'quantity' => (float) $item->quantity,
                    'unit' => $item->unit,
                ])->values();

                $formattedDate = Carbon::parse($group[0]->date)->format('d/m/Y');

                return [
                    'date' => $formattedDate,
                    'shift' => $group[0]->shift,
                    'records' => $records,
                    'totalChemicals' => $records->filter(fn($r) => $r['quantity'] > 0)->count(),
                ];
            })
            ->sortByDesc(fn($g) => $g['date'] . '_' . $g['shift']) // เรียงกลุ่มใหม่สุดก่อน
            ->values();

        // Paginate แบบ manual (10 กลุ่มต่อหน้า)
        $perPage = 10;
        $currentPage = (int) request()->input('page', 1);
        $lastPage = ceil($grouped->count() / $perPage);

        $pagedGroups = $grouped->slice(($currentPage - 1) * $perPage, $perPage)->values();

        // สร้าง pagination object พร้อม URL สำหรับปุ่ม
        $pagination = [
            'total' => $grouped->count(),
            'per_page' => $perPage,
            'current_page' => $currentPage,
            'last_page' => $lastPage,
            'from' => ($currentPage - 1) * $perPage + 1,
            'to' => ($currentPage - 1) * $perPage + $pagedGroups->count(),
            'first_page_url' => '?page=1',
            'last_page_url' => '?page=' . $lastPage,
            'prev_page_url' => $currentPage > 1 ? '?page=' . ($currentPage - 1) : null,
            'next_page_url' => $currentPage < $lastPage ? '?page=' . ($currentPage + 1) : null,
            'links' => collect(range(1, $lastPage))->map(fn($i) => [
                'url' => '?page=' . $i,
                'label' => (string) $i,
                'active' => $i == $currentPage,
            ]),
        ];

        return Inertia::render('Chemical/Index', [
            'records' => $pagedGroups,
            'pagination' => $pagination,
        ]);
    }









    // แสดงฟอร์มสร้างใหม่ (อาจไม่ต้องใช้สำหรับ Daily Chemicals)
    public function create()
    {

        // dd('This method is not used for Daily Chemicals. Use the store method instead.');


        return Inertia::render('Chemical/Create');
    }

    // บันทึกข้อมูลใหม่ (สำหรับ Daily Chemicals)
public function store(Request $request)
{
    $request->validate([
        'date' => 'required|date', // เพิ่ม validation สำหรับวันที่
        'records' => 'required|array',
        'records.*.chemical_name' => 'required|string',
        'records.*.unit' => 'required|string',
        'records.*.quantityA' => 'required|numeric|min:0',
        'records.*.quantityB' => 'required|numeric|min:0',
    ]);

    // ใช้วันที่จาก request แทนวันที่ปัจจุบัน
    $selectedDate = $request->date;

    foreach ($request->records as $r) {
        foreach (['A' => 'quantityA', 'B' => 'quantityB'] as $shift => $field) {
            $qty = !empty($r[$field]) ? (float) $r[$field] : 0;
            if ($qty > 0) {
                // ค้นหาข้อมูลที่มีอยู่สำหรับวันที่ที่เลือก (แทนวันที่ปัจจุบัน)
                $existing = DailyChemical::where('date', $selectedDate)
                    ->where('shift', $shift)
                    ->where('chemical_name', $r['chemical_name'])
                    ->first();

                if ($existing) {
                    $existing->quantity += $qty;
                    $existing->save();
                } else {
                    DailyChemical::create([
                        'date' => $selectedDate, // ใช้วันที่ที่ผู้ใช้เลือก
                        'shift' => $shift,
                        'chemical_name' => $r['chemical_name'],
                        'unit' => $r['unit'],
                        'quantity' => $qty,
                    ]);
                }
            }
        }
    }

    return back()->with('success', 'บันทึกข้อมูลสำเร็จ');
}





    // แสดงรายละเอียดของกะแต่ละวัน
    public function show($date, $shift)
    {
        $records = DB::table('daily_chemicals')
            ->where('date', $date)
            ->where('shift', $shift)
            ->get();

        return Inertia::render('Chemical/Show', [
            'date' => $date,
            'shift' => $shift,
            'records' => $records,
        ]);
    }

    // แก้ไขข้อมูล
    public function edit($id)
    {


        $record = DB::table('daily_chemicals')->where('id', $id)->first();

        if (!$record) {
            abort(404);
        }
        dd($record);

        // ดึงสารเคมีทั้งหมดใน shift เดียวกันของวันนั้น
        $records = DB::table('daily_chemicals')
            ->where('date', $record->date)
            ->where('shift', $record->shift)
            ->select('id', 'chemical_name', 'unit', 'quantity')
            ->get();

        return Inertia::render('Chemical/Edit', [
            'records' => $records,
            'shift' => $record->shift,
            'date' => $record->date,
        ]);
    }


    // อัปเดตข้อมูล
    public function update(Request $request, $id)
    {
        $records = $request->input('records', []);

        foreach ($records as $item) {
            // อัปเดตเฉพาะ shift A
            DB::table('daily_chemicals')
                ->where('id', $item['id'])
                ->where('shift', 'A')
                ->update([
                    'quantity' => $item['quantityA'],
                    'updated_at' => now(),
                ]);

            // อัปเดตเฉพาะ shift B
            DB::table('daily_chemicals')
                ->where('id', $item['id'])
                ->where('shift', 'B')
                ->update([
                    'quantity' => $item['quantityB'],
                    'updated_at' => now(),
                ]);
        }

        return redirect()->back()->with('success', 'แก้ไขข้อมูลสำเร็จ');
    }

    // ลบข้อมูล
    public function destroy(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return redirect()->route('chemical.index')->with('error', 'No records selected.');
        }

        // ลบ records ทั้งหมดที่อยู่ใน array
        DB::table('daily_chemicals')->whereIn('id', $ids)->delete();

        return redirect()->route('chemical.index')->with('success', 'Records deleted successfully.');
    }

    // หรือถ้าต้องการเปลี่ยน route
    public function deleteRecords(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['error' => 'No records selected.'], 400);
        }

        // ลบ records ทั้งหมดที่อยู่ใน array
        DB::table('daily_chemicals')->whereIn('id', $ids)->delete();

        return response()->json(['success' => 'Records deleted successfully.']);
    }
    public function monthly()
    {
        $raw = DailyChemical::orderBy('date')
            ->orderBy('shift')
            ->orderBy('created_at')
            ->get();

        // Group by date + shift
        $records = $raw->groupBy(function ($item) {
            return $item->date . '_' . $item->shift;
        })->map(function ($group) {
            $records = $group->map(fn($item) => [
                'id' => $item->id,
                'chemical_name' => $item->chemical_name,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
            ])->values();

               $formattedDate = Carbon::parse($group[0]->date)->format('d/m/Y');


            return [
                'date' => $formattedDate,
                'shift' => $group[0]->shift,
                'records' => $records,
                'totalChemicals' => $records->filter(fn($r) => $r['quantity'] > 0)->count(),
            ];
        })->values();

        return Inertia::render('Chemical/Monthly', [
            'records' => $records,
        ]);
    }


    // Export ข้อมูลเป็น Excel
    public function exportExcel(Request $request)
    {
        $month = $request->input('month', now()->format('m'));
        $year = now()->format('Y');

        $data = $this->getMonthlyData($month, $year);

        // ✅ Default Chemicals ใหม่ (ไม่มี PAC)
        $chemicals = [
            'ดินขาว',
            'Fogon 3000',
            'Hexon 4000',
            'Sumalchlor 50',
            'PROXITANE',
            'Polymer',
            'Soda Ash',
            'Salt'
        ];

        // หัวตาราง
        $header = array_merge(['วันที่'], $chemicals);
        $exportData = [$header];

        // รวมแต่ละเดือน
        $monthlyTotals = array_fill_keys($chemicals, 0);

        foreach ($data as $record) {
            $rowData = array_fill_keys($chemicals, 0);
            $rowData['date'] = $record['date'];

            // รวมปริมาณสารเคมีสำหรับวันนี้
            foreach ($record['records'] as $chemical) {
                $name = $chemical['chemical_name'];
                if (isset($rowData[$name])) {
                    $rowData[$name] += $chemical['quantity'];
                    $monthlyTotals[$name] += $chemical['quantity'];
                }
            }

            // แปลงตามลำดับ header
            $exportData[] = array_map(fn($h) => $h === 'วันที่' ? $rowData['date'] : $rowData[$h], $header);
        }

        // แถวรวมทั้งเดือน
        $exportData[] = array_merge(['รวมทั้งเดือน'], array_values($monthlyTotals));

        return Excel::download(
            new ChemicalsMonthlyExport($exportData, $month, $year),
            'chemicals-monthly-' . $year . '-' . $month . '.xlsx'
        );
    }
    private function getMonthlyData($month, $year)
    {
        $raw = DailyChemical::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date')
            ->orderBy('shift')
            ->orderBy('created_at')
            ->get();

        // ✅ Default Chemicals ใหม่
        $chemicals = [
            'ดินขาว',
            'Fogon 3000',
            'Hexon 4000',
            'Sumalchlor 50',
            'PROXITANE',
            'Polymer',
            'Soda Ash',
            'Salt'
        ];

        // Group by date
        return $raw->groupBy('date')->map(function ($dayGroups, $date) use ($chemicals) {
            $dayChemicals = array_fill_keys($chemicals, 0);

            // รวมปริมาณสารเคมีสำหรับวันนี้
            foreach ($dayGroups as $record) {
                $name = $record->chemical_name;
                if (isset($dayChemicals[$name])) {
                    $dayChemicals[$name] += (float) $record->quantity;
                }
            }

            return [
                'date' => $date,
                'records' => collect($dayChemicals)->map(function ($quantity, $name) {
                    return [
                        'chemical_name' => $name,
                        'quantity' => $quantity,
                        'unit' => 'กก.'
                    ];
                })->values()->toArray()
            ];
        })->values();
    }

}
