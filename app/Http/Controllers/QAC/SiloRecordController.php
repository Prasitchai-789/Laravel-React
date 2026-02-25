<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\QAC\SiloRecord;
use App\Models\QAC\StockProduct;
use App\Models\MAR\SOPlan;
use Illuminate\Support\Facades\DB;
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

    /**
     * API: ดึงข้อมูลสำหรับกรณีไม่ผลิต
     * - ยอดขาย PKN (GoodID 2152)
     * - stock PKN จากวันก่อนหน้า
     * - silo_1, silo_2 จากวันก่อนหน้า
     */
    public function apiKernelNoProductionData(Request $request)
    {
        try {
            $date = $request->query('date');
            if (!$date) {
                return response()->json(['success' => false, 'message' => 'Missing date parameter']);
            }

            // ยอดขาย PKN วันนั้น (GoodID 2152)
            $salesKN = DB::connection('sqlsrv2')
                ->table('SOPlan')
                ->selectRaw('SUM(NetWei) AS total_netwei')
                ->whereDate('SOPDate', $date)
                ->where('GoodID', 2152)
                ->first();

            $pkn_sold = $salesKN ? round((float) $salesKN->total_netwei / 1000, 3) : 0;

            // stock_products วันก่อนหน้า
            $previousStock = DB::table('stock_products')
                ->whereDate('record_date', '<', $date)
                ->orderBy('record_date', 'desc')
                ->first();

            $pkn_stock = $previousStock ? round((float) $previousStock->pkn, 3) : 0;
            $silo_1_stock = $previousStock ? round((float) $previousStock->silo_1, 3) : 0;
            $silo_2_stock = $previousStock ? round((float) $previousStock->silo_2, 3) : 0;

            $pkn_remaining = round($pkn_stock - $pkn_sold, 3);
            $shortfall = $pkn_remaining < 0 ? round(abs($pkn_remaining), 3) : 0;

            return response()->json([
                'success' => true,
                'date' => $date,
                'pkn_stock' => $pkn_stock,
                'pkn_sold' => $pkn_sold,
                'pkn_remaining' => $pkn_remaining,
                'shortfall' => $shortfall,
                'silo_1_stock' => $silo_1_stock,
                'silo_2_stock' => $silo_2_stock,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }
    // =========================================================
    // Helper: คำนวณ silo levels ย้อนกลับสำหรับวันไม่ผลิต
    // ใช้ stock_products เป็น authoritative source ของ PKN / silo_1 / silo_2
    // silo_record ก่อนหน้า: ใช้เฉพาะ nut levels และ split ratio ของ sale silo
    // =========================================================
    private function calcNoProductionSiloLevels(
        string $date,
        float $pkn_sold,
        float $silo1Transfer,
        float $silo2Transfer,
        float $nutOutside,
        float $kernelOutside
    ): array {
        // --- สูตรคงที่ (เหมือน Model) ---
        $CONST = [
            'nut_silo_1'      => 614, 'nut_silo_2'      => 614, 'nut_silo_3'   => 614,
            'kernel_silo_1'   => 640, 'kernel_silo_2'   => 640,
            'silo_sale_big'   => 920, 'silo_sale_small' => 870,
        ];
        $MULT = [
            'nut_silo_1'      => 0.0453, 'nut_silo_2'     => 0.0453, 'nut_silo_3'   => 0.0538,
            'kernel_silo_1'   => 0.0296, 'kernel_silo_2'  => 0.0296,
            'silo_sale_big'   => 0.228,  'silo_sale_small' => 0.228,
        ];

        // ฟังก์ชั่น reverse (qty → level), clamp ไว้ใน [0, CONST]
        $toLevel = fn($qty, $key) =>
            min($CONST[$key], max(0, round($CONST[$key] - ($qty / $MULT[$key]), 2)));

        // --- [1] stock_products วันก่อนหน้า (authoritative PKN + silo_1/2) ---
        $prevStock = DB::table('stock_products')
            ->whereDate('record_date', '<', $date)
            ->orderBy('record_date', 'desc')
            ->first();

        $prev_pkn   = $prevStock ? (float)$prevStock->pkn   : 0;
        $prev_silo1 = $prevStock ? (float)$prevStock->silo_1 : 0;
        $prev_silo2 = $prevStock ? (float)$prevStock->silo_2 : 0;

        // --- [2] silo_record วันก่อนหน้า (nut levels, moisture, shell, sale ratio) ---
        $prevSilo = SiloRecord::whereDate('record_date', '<', $date)
            ->orderBy('record_date', 'desc')
            ->first();

        // nut levels → ใช้ค่าเดิมจาก prev silo ไม่เปลี่ยนแปลง
        $prevNut1Level = $prevSilo ? (float)$prevSilo->nut_silo_1_level : $CONST['nut_silo_1'];
        $prevNut2Level = $prevSilo ? (float)$prevSilo->nut_silo_2_level : $CONST['nut_silo_2'];
        $prevNut3Level = $prevSilo ? (float)$prevSilo->nut_silo_3_level : $CONST['nut_silo_3'];

        // moisture + shell → ดึงจากวันก่อนหน้าเสมอ
        $prevMoisture  = $prevSilo ? (float)$prevSilo->moisture_percent : 0;
        $prevShell     = $prevSilo ? (float)$prevSilo->shell_percent    : 0;

        // --- [3] ถ้าไม่มียอดขาย (pkn_sold == 0) และไม่มี transfer → copy ทุก level จาก prev ทันที ---
        $hasNoSales     = $pkn_sold <= 0;
        $hasNoTransfer  = $silo1Transfer <= 0 && $silo2Transfer <= 0;

        if ($hasNoSales && $hasNoTransfer) {
            // ไม่มีอะไรเปลี่ยน copy สถานะวันเก่ามาทั้งหมด
            $prevKernel1Level = $prevSilo ? (float)$prevSilo->kernel_silo_1_level : $CONST['kernel_silo_1'];
            $prevKernel2Level = $prevSilo ? (float)$prevSilo->kernel_silo_2_level : $CONST['kernel_silo_2'];
            $prevSaleBig      = $prevSilo ? (float)$prevSilo->silo_sale_big_level : $CONST['silo_sale_big'];
            $prevSaleSm       = $prevSilo ? (float)$prevSilo->silo_sale_small_level : $CONST['silo_sale_small'];

            return [
                'record_date'           => $date,
                'is_production'         => false,
                'nut_silo_1_level'      => round($prevNut1Level, 2),
                'nut_silo_2_level'      => round($prevNut2Level, 2),
                'nut_silo_3_level'      => round($prevNut3Level, 2),
                'kernel_silo_1_level'   => round($prevKernel1Level, 2),
                'kernel_silo_2_level'   => round($prevKernel2Level, 2),
                'silo_sale_big_level'   => round($prevSaleBig, 2),
                'silo_sale_small_level' => round($prevSaleSm, 2),
                'kernel_outside_pile'   => $kernelOutside,
                'moisture_percent'      => $prevMoisture,
                'shell_percent'         => $prevShell,
                'outside_nut'           => $nutOutside,
            ];
        }

        // --- [4] มียอดขาย หรือมี transfer → คำนวณย้อนกลับ ---

        // sale silo ratio (big vs small) จาก prev silo level (ใช้เฉพาะ ratio)
        $prevBigLevelRaw = $prevSilo ? (float)$prevSilo->silo_sale_big_level   : $CONST['silo_sale_big'];
        $prevSmLevelRaw  = $prevSilo ? (float)$prevSilo->silo_sale_small_level : $CONST['silo_sale_small'];
        $rawBigQty = ($CONST['silo_sale_big']   - $prevBigLevelRaw) * $MULT['silo_sale_big'];
        $rawSmQty  = ($CONST['silo_sale_small'] - $prevSmLevelRaw)  * $MULT['silo_sale_small'];
        $rawSum    = $rawBigQty + $rawSmQty;

        // new_pkn = prev_pkn - pkn_sold + transfer
        $new_pkn    = max(0, $prev_pkn - $pkn_sold + $silo1Transfer + $silo2Transfer);
        $newSaleSum = max(0, ($new_pkn - 12) * 2);

        // split big vs small ตาม ratio เดิม (ถ้า rawSum <= 0 ให้ 50/50)
        if ($rawSum > 0) {
            $ratio     = $rawBigQty / $rawSum;
            $newBigQty = $newSaleSum * $ratio;
            $newSmQty  = $newSaleSum * (1 - $ratio);
        } else {
            $newBigQty = $newSmQty = $newSaleSum / 2;
        }

        // reverse → levels (ถ้า qty == 0 ให้ level = constant = ว่างเปล่า)
        $newSaleBigLevel = $newBigQty > 0 ? $toLevel($newBigQty, 'silo_sale_big')   : $CONST['silo_sale_big'];
        $newSaleSmLevel  = $newSmQty  > 0 ? $toLevel($newSmQty,  'silo_sale_small') : $CONST['silo_sale_small'];

        // Kernel Silo: ใช้ stock_products.silo_1/2 หักด้วย transfer
        $new_silo1 = max(0, $prev_silo1 - $silo1Transfer);
        $new_silo2 = max(0, $prev_silo2 - $silo2Transfer);
        $newKernel1Level = $new_silo1 > 0 ? $toLevel($new_silo1, 'kernel_silo_1') : $CONST['kernel_silo_1'];
        $newKernel2Level = $new_silo2 > 0 ? $toLevel($new_silo2, 'kernel_silo_2') : $CONST['kernel_silo_2'];

        return [
            'record_date'           => $date,
            'is_production'         => false,
            'nut_silo_1_level'      => round($prevNut1Level, 2),
            'nut_silo_2_level'      => round($prevNut2Level, 2),
            'nut_silo_3_level'      => round($prevNut3Level, 2),
            'kernel_silo_1_level'   => $newKernel1Level,
            'kernel_silo_2_level'   => $newKernel2Level,
            'silo_sale_big_level'   => $newSaleBigLevel,
            'silo_sale_small_level' => $newSaleSmLevel,
            'kernel_outside_pile'   => $kernelOutside,
            'moisture_percent'      => $prevMoisture,
            'shell_percent'         => $prevShell,
            'outside_nut'           => $nutOutside,
        ];
    }


    public function store(Request $request)
    {
        $isProduction = $request->input('is_production', true);

        // === กรณีไม่ผลิต ===
        if (!$isProduction) {
            $validated = $request->validate([
                'record_date'            => 'required|date',
                'silo_1_transfer_amount' => 'nullable|numeric|min:0',
                'silo_2_transfer_amount' => 'nullable|numeric|min:0',
                'nut_outside'            => 'nullable|numeric|min:0',
                'kernel_outside'         => 'nullable|numeric|min:0',
            ]);

            $date          = $validated['record_date'];
            $silo1Transfer = (float) ($validated['silo_1_transfer_amount'] ?? 0);
            $silo2Transfer = (float) ($validated['silo_2_transfer_amount'] ?? 0);
            $totalTransfer = $silo1Transfer + $silo2Transfer;
            $nutOutside    = (float) ($validated['nut_outside'] ?? 0);
            $kernelOutside = (float) ($validated['kernel_outside'] ?? 0);

            if (SiloRecord::where('record_date', $date)->exists()) {
                return back()->with('error', 'มีข้อมูลสำหรับวันที่นี้แล้ว');
            }

            // ดึงยอดขาย PKN
            $salesKN = DB::connection('sqlsrv2')
                ->table('SOPlan')
                ->selectRaw('SUM(NetWei) AS total_netwei')
                ->whereDate('SOPDate', $date)
                ->where('GoodID', 2152)
                ->first();
            $pkn_sold = $salesKN ? round((float) $salesKN->total_netwei / 1000, 3) : 0;

            // คำนวณ silo levels ย้อนกลับ
            $siloData = $this->calcNoProductionSiloLevels(
                $date, $pkn_sold, $silo1Transfer, $silo2Transfer, $nutOutside, $kernelOutside
            );
            SiloRecord::create($siloData);

            // stock วันก่อนหน้า
            $prevStock = DB::table('stock_products')
                ->whereDate('record_date', '<', $date)
                ->orderBy('record_date', 'desc')
                ->first();

            $pkn_stock = $prevStock ? (float) $prevStock->pkn : 0;
            $silo_1    = $prevStock ? (float) $prevStock->silo_1 : 0;
            $silo_2    = $prevStock ? (float) $prevStock->silo_2 : 0;

            // คำนวณ PKN ใหม่
            $pkn_new = round($pkn_stock - $pkn_sold + $totalTransfer, 3);
            $silo_1  = round($silo_1 - $silo1Transfer, 3);
            $silo_2  = round($silo_2 - $silo2Transfer, 3);

            StockProduct::updateOrCreate(
                ['record_date' => $date],
                [
                    'pkn'     => $pkn_new,
                    'pkn_out' => $kernelOutside,
                    'nut_out' => $nutOutside,
                    'silo_1'  => $silo_1,
                    'silo_2'  => $silo_2,
                ]
            );

            return redirect()->route('stock.kernel.index')->with('success', 'บันทึกข้อมูล (ไม่ผลิต) สำเร็จ');
        }

        // === กรณีผลิต ===
        $validated = $request->validate([
            'record_date'          => 'required|date',
            'nut_silo_1_level'     => 'required|numeric',
            'nut_silo_2_level'     => 'required|numeric',
            'nut_silo_3_level'     => 'required|numeric',
            'kernel_silo_1_level'  => 'required|numeric',
            'kernel_silo_2_level'  => 'required|numeric',
            'silo_sale_big_level'  => 'required|numeric',
            'silo_sale_small_level'=> 'required|numeric',
            'kernel_outside_pile'  => 'nullable|numeric',
            'moisture_percent'     => 'nullable|numeric',
            'shell_percent'        => 'nullable|numeric',
            'outside_nut'          => 'nullable|numeric',
        ]);

        $validated['kernel_outside_pile'] = $validated['kernel_outside_pile'] ?? 0;
        $validated['moisture_percent']    = $validated['moisture_percent'] ?? 0;
        $validated['shell_percent']       = $validated['shell_percent'] ?? 0;
        $validated['outside_nut']         = $validated['outside_nut'] ?? 0;

        if (SiloRecord::where('record_date', $validated['record_date'])->exists()) {
            return back()->with('error', 'มีข้อมูลสำหรับวันที่นี้แล้ว');
        }

        // บันทึก SiloRecord แบบผลิต
        $silo = new SiloRecord(array_merge($validated, ['is_production' => true]));
        $silo->save();

        $nut_silo_1    = $silo->nut_silo_1_quantity;
        $nut_silo_2    = $silo->nut_silo_2_quantity;
        $nut_silo_3    = $silo->nut_silo_3_quantity;
        $kernel_silo_1 = $silo->kernel_silo_1_quantity;
        $kernel_silo_2 = $silo->kernel_silo_2_quantity;
        $big           = floatval($silo->silo_sale_big_quantity);
        $small         = floatval($silo->silo_sale_small_quantity);
        $sum           = $big + $small;
        $kernel_total  = $sum > 0 ? round(($sum / 2) + 12, 3) : 0;

        $stock = StockProduct::where('record_date', $validated['record_date'])->first();
        if ($stock) {
            $stock->update([
                'pkn'     => $kernel_total,
                'pkn_out' => $validated['kernel_outside_pile'],
                'nut'     => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out' => $validated['outside_nut'],
                'silo_1'  => $kernel_silo_1,
                'silo_2'  => $kernel_silo_2,
            ]);
        } else {
            StockProduct::create([
                'record_date' => $validated['record_date'],
                'pkn'         => $kernel_total,
                'pkn_out'     => $validated['kernel_outside_pile'],
                'nut'         => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out'     => $validated['outside_nut'],
                'silo_1'      => $kernel_silo_1,
                'silo_2'      => $kernel_silo_2,
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
        $isProduction = $request->input('is_production', true);

        // === กรณีไม่ผลิต ===
        if (!$isProduction) {
            $validated = $request->validate([
                'record_date'            => 'required|date',
                'silo_1_transfer_amount' => 'nullable|numeric|min:0',
                'silo_2_transfer_amount' => 'nullable|numeric|min:0',
                'nut_outside'            => 'nullable|numeric|min:0',
                'kernel_outside'         => 'nullable|numeric|min:0',
            ]);

            $date          = $validated['record_date'];
            $silo1Transfer = (float) ($validated['silo_1_transfer_amount'] ?? 0);
            $silo2Transfer = (float) ($validated['silo_2_transfer_amount'] ?? 0);
            $totalTransfer = $silo1Transfer + $silo2Transfer;
            $nutOutside    = (float) ($validated['nut_outside'] ?? 0);
            $kernelOutside = (float) ($validated['kernel_outside'] ?? 0);

            // ดึงยอดขาย PKN
            $salesKN = DB::connection('sqlsrv2')
                ->table('SOPlan')
                ->selectRaw('SUM(NetWei) AS total_netwei')
                ->whereDate('SOPDate', $date)
                ->where('GoodID', 2152)
                ->first();
            $pkn_sold = $salesKN ? round((float) $salesKN->total_netwei / 1000, 3) : 0;

            // คำนวณ silo levels ย้อนกลับ
            $siloData = $this->calcNoProductionSiloLevels(
                $date, $pkn_sold, $silo1Transfer, $silo2Transfer, $nutOutside, $kernelOutside
            );
            $siloRecord->update($siloData);

            // stock วันก่อนหน้า
            $prevStock = DB::table('stock_products')
                ->whereDate('record_date', '<', $date)
                ->orderBy('record_date', 'desc')
                ->first();

            $pkn_stock = $prevStock ? (float) $prevStock->pkn : 0;
            $silo_1    = $prevStock ? (float) $prevStock->silo_1 : 0;
            $silo_2    = $prevStock ? (float) $prevStock->silo_2 : 0;

            $pkn_new = round($pkn_stock - $pkn_sold + $totalTransfer, 3);
            $silo_1  = round($silo_1 - $silo1Transfer, 3);
            $silo_2  = round($silo_2 - $silo2Transfer, 3);

            StockProduct::updateOrCreate(
                ['record_date' => $date],
                [
                    'pkn'     => $pkn_new,
                    'pkn_out' => $kernelOutside,
                    'nut_out' => $nutOutside,
                    'silo_1'  => $silo_1,
                    'silo_2'  => $silo_2,
                ]
            );

            return redirect()->route('stock.kernel.index')->with('success', 'อัพเดทข้อมูล (ไม่ผลิต) สำเร็จ');
        }

        // === กรณีผลิต ===
        $validated = $request->validate([
            'record_date'          => 'required|date',
            'nut_silo_1_level'     => 'required|numeric',
            'nut_silo_2_level'     => 'required|numeric',
            'nut_silo_3_level'     => 'required|numeric',
            'kernel_silo_1_level'  => 'required|numeric',
            'kernel_silo_2_level'  => 'required|numeric',
            'silo_sale_big_level'  => 'required|numeric',
            'silo_sale_small_level'=> 'required|numeric',
            'kernel_outside_pile'  => 'nullable|numeric',
            'moisture_percent'     => 'nullable|numeric',
            'shell_percent'        => 'nullable|numeric',
            'outside_nut'          => 'nullable|numeric',
        ]);

        $validated['kernel_outside_pile'] = $validated['kernel_outside_pile'] ?? 0;
        $validated['moisture_percent']    = $validated['moisture_percent'] ?? 0;
        $validated['shell_percent']       = $validated['shell_percent'] ?? 0;
        $validated['outside_nut']         = $validated['outside_nut'] ?? 0;

        $siloRecord->update(array_merge($validated, ['is_production' => true]));

        $silo            = $siloRecord->fresh();
        $nut_silo_1      = $silo->nut_silo_1_quantity;
        $nut_silo_2      = $silo->nut_silo_2_quantity;
        $nut_silo_3      = $silo->nut_silo_3_quantity;
        $kernel_silo_1   = $silo->kernel_silo_1_quantity;
        $kernel_silo_2   = $silo->kernel_silo_2_quantity;
        $silo_sale_big   = floatval($silo->silo_sale_big_quantity);
        $silo_sale_small = floatval($silo->silo_sale_small_quantity);
        $sum             = $silo_sale_big + $silo_sale_small;
        $kernel_total    = $sum > 0 ? round(($sum / 2) + 12, 3) : 0;

        $stock = StockProduct::where('record_date', $validated['record_date'])->first();
        if ($stock) {
            $stock->update([
                'pkn'     => $kernel_total,
                'pkn_out' => $validated['kernel_outside_pile'],
                'nut'     => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out' => $validated['outside_nut'],
                'silo_1'  => $kernel_silo_1,
                'silo_2'  => $kernel_silo_2,
            ]);
        } else {
            StockProduct::create([
                'record_date' => $validated['record_date'],
                'pkn'         => $kernel_total,
                'pkn_out'     => $validated['kernel_outside_pile'],
                'nut'         => $nut_silo_1 + $nut_silo_2 + $nut_silo_3,
                'nut_out'     => $validated['outside_nut'],
                'silo_1'      => $kernel_silo_1,
                'silo_2'      => $kernel_silo_2,
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
