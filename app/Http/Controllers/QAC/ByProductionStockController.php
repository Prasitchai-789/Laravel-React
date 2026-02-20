<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use App\Models\MAR\SOPlan;
use Illuminate\Http\Request;
use App\Models\PRO\Production;
use App\Models\QAC\StockProduct;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\QAC\ByProductionStock;

class ByProductionStockController extends Controller
{


    public function index()
    {
        return Inertia::render('QAC/ByProductionForm', []);
    }
    public function apiByProduction()
    {
        try {
            $records = ByProductionStock::orderBy('production_date', 'desc')->get();
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

    public function apiGetProduction()
    {
        try {
            $productions = Production::select('Date', 'id', 'FFBPurchase', 'FFBGoodQty')->orderBy('Date', 'desc')->get();
            return response()->json([
                'success' => true,
                'productions' => $productions,
                'message' => 'โหลดข้อมูลเรียบร้อยแล้ว',
                'count' => $productions->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'records' => []
            ], 500);
        }
    }

    public function getByDate(Request $request)
    {
        $request->validate([
            'date' => 'required|string'
        ]);

        $date = $this->strictDateParser($request->date);

        if (!$date) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid date format'
            ], 400);
        }

        // ⭐ เปลี่ยนชื่อ table/field ให้ตรง database ของคุณ
        $production = DB::connection('sqlsrv3')
            ->table('productions') // ← เปลี่ยนตรงนี้
            ->whereDate('Date', $date)
            ->select('FFBGoodQty')
            ->first();

        return response()->json([
            'success' => true,
            'date' => $date,
            'FFBGoodQty' => $production->FFBGoodQty ?? 0,
        ]);
    }



    public function apiSumSales()
    {
        try {
            $sales = SOPlan::select(
                'SOPDate',
                'GoodID',
                DB::raw('SUM(NetWei) AS total_netwei')
            )
                ->groupBy('SOPDate', 'GoodID')
                ->orderBy('SOPDate', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'sales' => $sales,
                'message' => 'โหลดข้อมูลเรียบร้อยแล้ว',
                'count' => $sales->count()
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
     * ดึงยอดยกมา (previous balance) จาก stock_products โดยตรง
     * ส่งวันที่มา → หาวันก่อนหน้าใน stock_products → คืน efb_fiber, efb, shell
     */
    public function apiPreviousBalance(Request $request)
    {
        try {
            $date = $request->query('date');

            if (!$date) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing date parameter',
                    'efb_fiber_previous_balance' => 0,
                    'efb_previous_balance' => 0,
                    'shell_previous_balance' => 0,
                ]);
            }

            $parsedDate = $this->strictDateParser($date);

            if (!$parsedDate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid date format',
                    'efb_fiber_previous_balance' => 0,
                    'efb_previous_balance' => 0,
                    'shell_previous_balance' => 0,
                ]);
            }

            // หาข้อมูลวันก่อนหน้าจาก stock_products
            $previous = DB::table('stock_products')
                ->whereDate('record_date', '<', $parsedDate)
                ->orderBy('record_date', 'desc')
                ->first();

            if ($previous) {
                return response()->json([
                    'success' => true,
                    'date' => $parsedDate,
                    'previous_date' => $previous->record_date,
                    'efb_fiber_previous_balance' => round((float) $previous->efb_fiber, 3),
                    'efb_previous_balance' => round((float) $previous->efb, 3),
                    'shell_previous_balance' => round((float) $previous->shell, 3),
                ]);
            }

            return response()->json([
                'success' => true,
                'date' => $parsedDate,
                'previous_date' => null,
                'efb_fiber_previous_balance' => 0,
                'efb_previous_balance' => 0,
                'shell_previous_balance' => 0,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'efb_fiber_previous_balance' => 0,
                'efb_previous_balance' => 0,
                'shell_previous_balance' => 0,
            ], 500);
        }
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'production_date' => 'required|date',
        'initial_palm_quantity' => 'required|numeric|min:0',
        'efb_fiber_percentage' => 'required|numeric|min:0|max:100',
        'efb_percentage' => 'nullable|numeric|min:0|max:100',
        'shell_percentage' => 'required|numeric|min:0|max:100',
        'efb_fiber_previous_balance' => 'nullable|numeric|min:0',
        'efb_previous_balance' => 'nullable|numeric|min:0',
        'shell_previous_balance' => 'nullable|numeric|min:0',
        'efb_fiber_sold' => 'nullable|numeric|min:0',
        'efb_sold' => 'nullable|numeric|min:0',
        'shell_sold' => 'nullable|numeric|min:0',
        'efb_fiber_other' => 'nullable|numeric|min:0',
        'efb_other' => 'nullable|numeric|min:0',
        'shell_other' => 'nullable|numeric|min:0',
        'notes' => 'nullable|string'
    ]);

    // ⭐ ป้องกัน NULL → ใส่ fallback 0 ให้ทุก field
    $validated = array_merge($validated, [
        'efb_percentage' => $validated['efb_percentage'] ?? 0,
        'efb_fiber_previous_balance' => $validated['efb_fiber_previous_balance'] ?? 0,
        'efb_previous_balance' => $validated['efb_previous_balance'] ?? 0,
        'shell_previous_balance' => $validated['shell_previous_balance'] ?? 0,
        'efb_fiber_sold' => $validated['efb_fiber_sold'] ?? 0,
        'efb_sold' => $validated['efb_sold'] ?? 0,
        'shell_sold' => $validated['shell_sold'] ?? 0,
        'efb_fiber_other' => $validated['efb_fiber_other'] ?? 0,
        'efb_other' => $validated['efb_other'] ?? 0,
        'shell_other' => $validated['shell_other'] ?? 0,
    ]);

    // -------------------------------------------------------
    // ✔ 1) กันข้อมูลซ้ำ
    // -------------------------------------------------------
    $existing = ByProductionStock::where('production_date', $validated['production_date'])->first();

    if ($existing) {
        $existing->fill($validated);

        $existing->calculateProducedQuantities();
        $existing->calculateBalances();

        $existing->save();

        $stock = $existing;
    } else {
        $stock = new ByProductionStock($validated);

        $stock->calculateProducedQuantities();
        $stock->calculateBalances();

        $stock->save();
    }

    // -------------------------------------------------------
    // ✔ 2) Update StockProduct
    // -------------------------------------------------------
    $productStock = StockProduct::where('record_date', $validated['production_date'])->first();

    if ($productStock) {
        $productStock->update([
            'efb_fiber' => $stock->efb_fiber_balance,
            'efb'       => $stock->efb_balance,
            'shell'     => $stock->shell_balance,
        ]);
    } else {
        StockProduct::create([
            'record_date' => $validated['production_date'],
            'efb_fiber'   => $stock->efb_fiber_balance,
            'efb'         => $stock->efb_balance,
            'shell'       => $stock->shell_balance,
        ]);
    }

    return response()->json([
        'message' => 'บันทึกข้อมูลสำเร็จ',
        'data' => $stock
    ], 201);
}




    public function show(ByProductionStock $palmProductionStock)
    {
        return response()->json($palmProductionStock);
    }

    private function strictDateParser($input)
    {
        if (!$input) return null;

        // If already YYYY-MM-DD
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $input)) {
            return $input;
        }

        // Handle: "Nov 15 2025 12:00:00:AM"
        $parts = explode(' ', $input);

        if (count($parts) >= 3) {
            $monthShort = $parts[0];
            $day        = preg_replace('/\D/', '', $parts[1]);
            $year       = preg_replace('/\D/', '', $parts[2]);

            $monthMap = [
                'Jan' => '01',
                'Feb' => '02',
                'Mar' => '03',
                'Apr' => '04',
                'May' => '05',
                'Jun' => '06',
                'Jul' => '07',
                'Aug' => '08',
                'Sep' => '09',
                'Oct' => '10',
                'Nov' => '11',
                'Dec' => '12',
            ];

            if (isset($monthMap[$monthShort])) {
                return "{$year}-{$monthMap[$monthShort]}-" . str_pad($day, 2, '0', STR_PAD_LEFT);
            }
        }

        // fallback
        $ts = strtotime($input);
        return $ts ? date('Y-m-d', $ts) : null;
    }


    public function update(Request $request, $id)
{
    $validated = $request->validate([
        'production_date' => 'required|date',
        'initial_palm_quantity' => 'required|numeric|min:0',
        'efb_fiber_percentage' => 'required|numeric|min:0|max:100',
        'efb_percentage' => 'nullable|numeric|min:0|max:100',
        'shell_percentage' => 'required|numeric|min:0|max:100',
        'efb_fiber_previous_balance' => 'nullable|numeric|min:0',
        'efb_previous_balance' => 'nullable|numeric|min:0',
        'shell_previous_balance' => 'nullable|numeric|min:0',
        'efb_fiber_sold' => 'nullable|numeric|min:0',
        'efb_sold' => 'nullable|numeric|min:0',
        'shell_sold' => 'nullable|numeric|min:0',
        'efb_fiber_other' => 'nullable|numeric|min:0',
        'efb_other' => 'nullable|numeric|min:0',
        'shell_other' => 'nullable|numeric|min:0',
        'notes' => 'nullable|string'
    ]);

    // ⭐ ป้องกัน NULL → ใส่ fallback ค่า 0 ให้ทุก field ที่เป็น nullable
    $validated = array_merge($validated, [
        'efb_percentage' => $validated['efb_percentage'] ?? 0,
        'efb_fiber_previous_balance' => $validated['efb_fiber_previous_balance'] ?? 0,
        'efb_previous_balance' => $validated['efb_previous_balance'] ?? 0,
        'shell_previous_balance' => $validated['shell_previous_balance'] ?? 0,
        'efb_fiber_sold' => $validated['efb_fiber_sold'] ?? 0,
        'efb_sold' => $validated['efb_sold'] ?? 0,
        'shell_sold' => $validated['shell_sold'] ?? 0,
        'efb_fiber_other' => $validated['efb_fiber_other'] ?? 0,
        'efb_other' => $validated['efb_other'] ?? 0,
        'shell_other' => $validated['shell_other'] ?? 0,
    ]);

    /* -------------------------------------------------------
    ✔ 1) ดึงข้อมูลเดิมเพื่อเปรียบเทียบ
    ------------------------------------------------------- */
    $stock = ByProductionStock::findOrFail($id);
    $oldDate = $this->strictDateParser($stock->production_date);
    $newDate = $this->strictDateParser($validated['production_date']);

    /* -------------------------------------------------------
    ✔ 2) ตรวจสอบวันที่ซ้ำ
    ------------------------------------------------------- */
    $duplicate = ByProductionStock::where('production_date', $newDate)
        ->where('id', '!=', $id)
        ->first();

    if ($duplicate) {
        return response()->json([
            'message' => "มีข้อมูลวันที่ {$newDate} อยู่แล้ว ไม่สามารถใช้วันที่ซ้ำได้"
        ], 422);
    }

    /* -------------------------------------------------------
    ✔ 3) UPDATE ข้อมูล ByProductionStock
    ------------------------------------------------------- */
    $stock->fill($validated);

    // คำนวณปริมาณ
    $stock->calculateProducedQuantities();
    $stock->calculateBalances();

    $stock->save();

    /* -------------------------------------------------------
    ✔ 4) UPDATE หรือ CREATE StockProduct
    ------------------------------------------------------- */

    $efb_fiber = $stock->efb_fiber_balance;
    $efb       = $stock->efb_balance;
    $shell     = $stock->shell_balance;

    if ($oldDate !== $newDate) {
        // ถ้าเปลี่ยนวันที่ → ลบยอดเก่า
        StockProduct::where('record_date', $oldDate)->delete();
    }

    StockProduct::updateOrCreate(
        ['record_date' => $newDate],
        [
            'efb_fiber' => $efb_fiber,
            'efb'       => $efb,
            'shell'     => $shell,
        ]
    );

    return response()->json([
        'message' => 'อัปเดตข้อมูลสำเร็จ',
        'data' => $stock
    ], 200);
}



    public function destroy($id)
    {
        try {
            // --- 1) Load record ---
            $record = ByProductionStock::findOrFail($id);

            // Raw date เช่น "Nov 13 2025 12:00:00:AM"
            $rawDate = $record->production_date;

            // --- 2) Clean / Normalize Date ---
            // แก้ ":" หน้า AM/PM เช่น "12:00:00:AM" → "12:00:00 AM"
            $clean = str_replace([':AM', ':PM'], [' AM', ' PM'], $rawDate);

            // แปลงเป็น YYYY-MM-DD ด้วย strtotime
            $formattedDate = date('Y-m-d', strtotime($clean));

            // --- 3) ลบข้อมูลปัจจุบัน ---
            $record->delete();

            // --- 4) ตรวจว่ามีข้อมูลวันเดียวกันเหลืออยู่ไหม ---
            $remaining = ByProductionStock::where('production_date', $clean)->count();

            // --- 5) โหลด stock ของวันนั้น ---
            $stockProduct = StockProduct::where('record_date', $clean)->first();

            if ($remaining === 0) {
// dd($stockProduct);
                // --- กรณีลบตัวสุดท้ายของวัน ---
                if ($stockProduct) {
                    $stockProduct->update([
                        'efb_fiber' => 0,
                        'efb'       => 0,
                        'shell'     => 0,
                    ]);
                }
            } else {

                // --- 6) ยังมีข้อมูลวันนั้น → คำนวณยอดรวมใหม่ ---
                $items = ByProductionStock::where('production_date', $clean)->get();

                $total_efb_fiber_balance = $items->sum('efb_fiber_balance');
                $total_efb_balance       = $items->sum('efb_balance');
                $total_shell_balance     = $items->sum('shell_balance');

                if ($stockProduct) {
                    // อัปเดตค่าใหม่ใน StockProduct
                    $stockProduct->update([
                        'efb_fiber' => $total_efb_fiber_balance,
                        'efb'       => $total_efb_balance,
                        'shell'     => $total_shell_balance,
                    ]);
                } else {

                    // ถ้าไม่มี stock ให้สร้างใหม่
                    StockProduct::create([
                        'record_date'        => $formattedDate,
                        'efb_fiber'  => $total_efb_fiber_balance,
                        'efb'        => $total_efb_balance,
                        'shell'      => $total_shell_balance,
                    ]);
                }
            }

             return redirect()->route('stock.by-products.index')->with('success', 'ลบข้อมูลสำเร็จ');
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการลบข้อมูล: ' . $e->getMessage(),
            ], 500);
        }
    }
}
