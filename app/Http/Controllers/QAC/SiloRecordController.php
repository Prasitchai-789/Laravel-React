<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\QAC\SiloRecord;
use App\Models\QAC\StockProduct;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class SiloRecordController extends Controller
{
    public function index()
    {
        $records = SiloRecord::orderBy('record_date', 'desc')->get();
        return Inertia::render('QAC/KernelIndex', [
            'records' => $records,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function apiRecord()
    {
        try {
            $records = SiloRecord::orderBy('record_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'records' => $records,
                'message' => 'โหลดข้อมูลเรียบร้อยแล้ว',
                'count' => $records->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'records' => []
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'record_date' => 'required|date',
            'nut_silo_1_level' => 'required|numeric',
            'nut_silo_2_level' => 'required|numeric',
            'nut_silo_3_level' => 'required|numeric',
            'kernel_silo_1_level' => 'required|numeric',
            'kernel_silo_2_level' => 'required|numeric',
            'silo_sale_big_level' => 'required|numeric',
            'silo_sale_small_level' => 'required|numeric',
            'kernel_outside_pile' => 'required|numeric',
            'moisture_percent' => 'required|numeric',
            'shell_percent' => 'required|numeric',
            'outside_nut' => 'required|numeric',
        ]);

        // ✅ ตรวจสอบ SiloRecord ก่อน
        if (SiloRecord::where('record_date', $validated['record_date'])->exists()) {
            return back()->with('error', 'มีข้อมูลสำหรับวันที่นี้แล้ว');
        }

        // ✅ สร้าง SiloRecord
        $silo = new SiloRecord($validated);
        $silo->save();

        // ✅ คำนวณค่าต่าง ๆ
        $nut_silo_1 = $silo->nut_silo_1_quantity;
        $nut_silo_2 = $silo->nut_silo_2_quantity;
        $nut_silo_3 = $silo->nut_silo_3_quantity;
        $kernel_silo_1 = $silo->kernel_silo_1_quantity;
        $kernel_silo_2 = $silo->kernel_silo_2_quantity;
        $silo_sale_big = $silo->silo_sale_big_quantity;
        $silo_sale_small = $silo->silo_sale_small_quantity;

        $kernel_total = ($silo_sale_big + $silo_sale_small) > 0
            ? (($silo_sale_big + $silo_sale_small) / 2) + 12
            : 0;

        // ✅ เช็คก่อน insert (update ถ้ามี)
        $stock = StockProduct::where('record_date', $validated['record_date'])->first();

        if ($stock) {
            $stock->update([
                'pkn' => $kernel_total,
                'pkn_out' => $validated['kernel_outside_pile'],
                'nut' => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out' => $validated['outside_nut'],
                'silo_1' => $kernel_silo_1,
                'silo_2' => $kernel_silo_2,
            ]);
        } else {
            StockProduct::create([
                'record_date' => $validated['record_date'],
                'pkn' => $kernel_total,
                'pkn_out' => $validated['kernel_outside_pile'],
                'nut' => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out' => $validated['outside_nut'],
                'silo_1' => $kernel_silo_1,
                'silo_2' => $kernel_silo_2,
            ]);
        }

        return redirect()->route('stock.kernel.index')->with('success', 'บันทึกข้อมูลสำเร็จ');
    }

    public function show(SiloRecord $siloRecord)
    {
        return response()->json($siloRecord);
    }

    public function update(Request $request, SiloRecord $siloRecord)
    {
        $validated = $request->validate([
            'record_date' => 'required|date',
            'nut_silo_1_level' => 'required|numeric',
            'nut_silo_2_level' => 'required|numeric',
            'nut_silo_3_level' => 'required|numeric',
            'kernel_silo_1_level' => 'required|numeric',
            'kernel_silo_2_level' => 'required|numeric',
            'silo_sale_big_level' => 'required|numeric',
            'silo_sale_small_level' => 'required|numeric',
            'kernel_outside_pile' => 'required|numeric',
            'moisture_percent' => 'required|numeric',
            'shell_percent' => 'required|numeric',
            'outside_nut' => 'required|numeric',
        ]);

        $siloRecord->update($validated);

        $silo = $siloRecord->fresh();
        $nut_silo_1 = $silo->nut_silo_1_quantity;
        $nut_silo_2 = $silo->nut_silo_2_quantity;
        $nut_silo_3 = $silo->nut_silo_3_quantity;
        $kernel_silo_1 = $silo->kernel_silo_1_quantity;
        $kernel_silo_2 = $silo->kernel_silo_2_quantity;
        $silo_sale_big = $silo->silo_sale_big_quantity;
        $silo_sale_small = $silo->silo_sale_small_quantity;

        $kernel_total = ($silo_sale_big + $silo_sale_small) > 0
            ? (($silo_sale_big + $silo_sale_small) / 2) + 12
            : 0;

        $stock = StockProduct::where('record_date', $validated['record_date'])->first();

        if ($stock) {
            $stock->update([
                'pkn' => $kernel_total,
                'pkn_out' => $validated['kernel_outside_pile'],
                'nut' => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out' => $validated['outside_nut'],
                'silo_1' => $kernel_silo_1,
                'silo_2' => $kernel_silo_2,
            ]);
        } else {
            StockProduct::create([
                'record_date' => $validated['record_date'],
                'pkn' => $kernel_total,
                'pkn_out' => $validated['kernel_outside_pile'],
                'nut' => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out' => $validated['outside_nut'],
                'silo_1' => $kernel_silo_1,
                'silo_2' => $kernel_silo_2,
            ]);
        }

        return redirect()->route('stock.kernel.index')->with('success', 'อัพเดทข้อมูลสำเร็จ');
    }


    public function destroy(SiloRecord $siloRecord)
    {
        try {
            $siloRecord = SiloRecord::findOrFail($siloRecord->id);
            $recordDate = $siloRecord->record_date;
            $clean = str_replace([':AM', ':PM'], [' AM', ' PM'], $recordDate);
            // แปลงรูปแบบวันที่
            $formattedDate = date('Y-m-d', strtotime($recordDate));

            $siloRecord->delete();

            $remainingRecords = SiloRecord::where('record_date', $clean)->count();

            $stockProduct = StockProduct::where('record_date', $clean)->first();

            if ($remainingRecords === 0) {
                if ($stockProduct) {
                    $stockProduct->update([
                        'pkn' => 0,
                        'pkn_out' => 0,
                        'nut' => 0,
                        'nut_out' => 0,
                        'silo_1' => 0,
                        'silo_2' => 0,
                    ]);
                }
            } else {
                // ถ้ายังมีข้อมูล CPOData ในวันที่นี้ ให้คำนวณ total_cpo ใหม่
                $remainingSiloRecord = SiloRecord::where('record_date', $recordDate)->get();

                $total_pkn = $remainingSiloRecord->sum('pkn');
                $total_pkn_out = $remainingSiloRecord->sum('pkn_out');
                $total_nut = $remainingSiloRecord->sum('nut');
                $total_nut_out = $remainingSiloRecord->sum('nut_out');
                $total_silo_1 = $remainingSiloRecord->sum('silo_1');
                $total_silo_2 = $remainingSiloRecord->sum('silo_2');

                // อัพเดท StockProduct
                if ($stockProduct) {
                    $stockProduct->update([
                        'pkn' => $total_pkn,
                        'pkn_out' => $total_pkn_out,
                        'nut' => $total_nut,
                        'nut_out' => $total_nut_out,
                        'silo_1' => $total_silo_1,
                        'silo_2' => $total_silo_2
                    ]);
                } else {
                    StockProduct::create([
                        'record_date' => $formattedDate,
                        'pkn' => $total_pkn,
                        'pkn_out' => $total_pkn_out,
                        'nut' => $total_nut,
                        'nut_out' => $total_nut_out,
                        'silo_1' => $total_silo_1,
                        'silo_2' => $total_silo_2
                    ]);
                }
            }

            return redirect()->route('stock.kernel.index')->with('success', 'ลบข้อมูลสำเร็จ');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบข้อมูล: ' . $e->getMessage()
            ], 500);
        }
    }
}
