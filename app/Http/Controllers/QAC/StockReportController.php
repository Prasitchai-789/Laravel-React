<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use App\Models\PRO\Production;
use App\Models\MAR\SOPlan;
use App\Models\QAC\CPOData;
use App\Models\QAC\ByProductionStock;

class StockReportController extends Controller
{
    public function index()
    {
        return Inertia::render('QAC/ProductionReport', []);
    }

    public function stockCPO()
    {
        return Inertia::render('QAC/StockCPO', []);
    }


    /* ================================
        API — Production Data
    ================================ */
    public function apiProductions()
    {
        try {
            $productions = Production::select(
                'Date',
                'id',
                'FFBPurchase',
                'FFBGoodQty'
            )
                ->orderBy('Date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'productions' => $productions,
                'message' => 'โหลดข้อมูล Production เรียบร้อยแล้ว',
                'count' => $productions->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'records' => [],
            ], 500);
        }
    }


    /* ================================
        API — Historical 7 days chart
    ================================ */
    public function getHistoricalData()
    {
        $days = request('days', 7);

        try {
            $data = DB::table('cpo_data')
                ->select('date', 'total_cpo')
                ->where('date', '>=', now()->subDays($days))
                ->orderBy('date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage(),
                'data' => [],
            ], 500);
        }
    }


    /* ================================
         API — Stock CPO by Date
    ================================ */
    public function getStockCpoByDate(Request $request)
    {
        try {
            $dateInput = $request->route('date');

            // แปลงทุกอย่างเป็น YYYY-MM-DD
            $formatted = $this->parseDateString($dateInput);

            $data = DB::table('cpo_data')
                ->where('date', 'LIKE', "%{$formatted}%")
                ->orderBy('id', 'desc')
                ->first();

            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => "ไม่พบข้อมูลสำหรับวันที่: {$formatted}",
                ], 404);
            }

            return response()->json([
                'success' => true,
                'stockCPO' => [$data],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }



    /* ================================
        Smart Date Parser (สำคัญมาก)
    ================================ */
    private function parseDateString($dateString)
    {
        if (!$dateString) {
            return null;
        }

        // 1) ถ้าเป็น YYYY-MM-DD อยู่แล้ว
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
            return $dateString;
        }

        // 2) ถ้าเป็นรูปแบบ d/m/Y
        if (preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $dateString)) {
            return \Carbon\Carbon::createFromFormat('d/m/Y', $dateString)->format('Y-m-d');
        }

        // 3) รูปแบบแบบ Nov 17 2025 12:00:00 AM
        $timestamp = strtotime($dateString);
        if ($timestamp !== false) {
            return date('Y-m-d', $timestamp);
        }

        // 4) fallback → ส่งคืนตามเดิม
        return $dateString;
    }


    /* ================================
        API — Get latest CPO
    ================================ */
    public function getStockCpo()
    {
        try {
            $data = DB::table('cpo_data')
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'stockCPO' => [$data],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage(),
            ], 500);
        }
    }


    /* ================================
        API — Sales Summary
    ================================ */
    public function apiSummarySales()
    {
        try {
            $query = SOPlan::select(
                'SOPDate',
                'GoodID',
                DB::raw('SUM(NetWei) AS total_netwei')
            );

            if (request()->has('date')) {
                $query->whereDate('SOPDate', request('date'));
            }

            if (request()->has('goodid')) {
                $query->where('GoodID', request('goodid'));
            }

            $sales = $query
                ->groupBy('SOPDate', 'GoodID')
                ->orderBy('SOPDate', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'sales' => $sales,
                'message' => 'โหลดข้อมูล Summary Sales เรียบร้อยแล้ว',
                'count' => $sales->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
                'records' => [],
            ], 500);
        }
    }


    /* ================================
        API — All Stock CPO
    ================================ */
    public function apiStockCPO()
    {
        try {
            $stockCPO = CPOData::all();

            return response()->json([
                'success' => true,
                'stockCPO' => $stockCPO,
                'message' => 'โหลดข้อมูล Stock CPO เรียบร้อยแล้ว',
                'count' => $stockCPO->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }


    /* ================================
        API — By Product Stock
    ================================ */
    public function apiByProductStock()
    {
        try {
            $byProducts = ByProductionStock::all();

            return response()->json([
                'success' => true,
                'byProducts' => $byProducts,
                'message' => 'โหลดข้อมูล Stock By Products เรียบร้อยแล้ว',
                'count' => $byProducts->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function summary(Request $request)
    {
        $date = $request->query('date');
        if (!$date) {
            return response()->json([
                'success' => false,
                'message' => 'Missing date'
            ]);
        }

        // -------------------
        // 1) Stock CPO วันที่เลือก
        // -------------------
        $current = DB::table('cpo_data')
            ->whereDate('date', $date)
            ->first();

        if (!$current) {
            return response()->json([
                'success' => false,
                'message' => "No stock data for date {$date}"
            ]);
        }

        $currentCPO = (float) $current->total_cpo;

        // -------------------
        // 2) Stock CPO วันก่อนหน้า
        // -------------------
        $previous = DB::table('cpo_data')
            ->whereDate('date', '<', $date)
            ->orderBy('date', 'desc')
            ->first();

        $previousCPO = $previous ? (float) $previous->total_cpo : 0;

        // -------------------
        // 3) ยอดขาย GoodID 2147
        // -------------------
        $sales = DB::connection('sqlsrv2')
            ->table('SOPlan')
            ->selectRaw('SUM(NetWei) AS total_netwei')
            ->whereDate('SOPDate', $date)
            ->where('GoodID', 2147)
            ->first();

        $salesTons = $sales ? ((float) $sales->total_netwei / 1000) : 0;

        // -------------------
        // 4) ปาล์มเข้าผลิต
        // -------------------
        $prod = DB::connection('sqlsrv3')
            ->table('productions')
            ->whereDate('Date', $date)
            ->first();

        $ffbGoodQty = $prod ? (float) $prod->FFBGoodQty : 0;

        // -------------------
        // 5) สูตร Yield
        // -------------------
        $yield = 0;
        if ($ffbGoodQty > 0) {
            $numerator = $currentCPO - ($previousCPO - $salesTons);
            $yield = ($numerator / $ffbGoodQty) * 100;
        }

        return response()->json([
            'success' => true,
            'date' => $date,
            'total_cpo' => round($currentCPO, 3),
            'previous_total_cpo' => round($previousCPO, 3),
            'sales_tons' => round($salesTons, 3),
            'ffb_good_qty' => round($ffbGoodQty, 3),
            'yield_percent' => round($yield, 3),
        ]);
    }



}
