<?php

namespace App\Http\Controllers\QAC;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\QAC\CPOData;
use App\Models\PRO\Production;
use App\Models\QAC\StockProduct;
use App\Models\MAR\SOPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class YieldTableController extends Controller
{
    /**
     * ดึงหน้า View ของ Inertia Component
     */
    public function index()
    {
        return Inertia::render('QAC/YieldTable');
    }

    /**
     * ดึงข้อมูลสำหรับตารางในลักษณะ Loop สรุปรายเดือน
     */
    public function apiData(Request $request)
    {
        try {
            $month = $request->query('month'); // format YYYY-MM
            if (!$month) {
                $month = now()->format('Y-m');
            }

            $year = intval(substr($month, 0, 4));
            $mon  = intval(substr($month, 5, 2));

            // สร้างช่วงต้นเดือน - สิ้นเดือน
            $startOfMonth = Carbon::createFromDate($year, $mon, 1)->startOfDay();
            $endOfMonth   = $startOfMonth->copy()->endOfMonth();

            // 1) ดึง Production (FFBGoodQty, FFBPurchase)
            $productions = Production::whereDate('Date', '>=', $startOfMonth->format('Y-m-d'))
                ->whereDate('Date', '<=', $endOfMonth->format('Y-m-d'))
                ->get()
                ->keyBy(function ($p) {
                    $raw = str_replace([':AM', ':PM'], [' AM', ' PM'], $p->Date);
                    return Carbon::parse($raw)->format('Y-m-d');
                });

            // 2) ดึง cpo_data (total_cpo, skim, product_cpo)
            $cpoRecords = CPOData::whereYear('date', $year)
                ->whereMonth('date', $mon)
                ->get()
                ->keyBy(function ($r) {
                    $raw = str_replace([':AM', ':PM'], [' AM', ' PM'], $r->date);
                    return Carbon::parse($raw)->format('Y-m-d');
                });

            // 3) ดึง stock_products สำหรับ KN (pkn)
            $stockRecords = StockProduct::whereYear('record_date', $year)
                ->whereMonth('record_date', $mon)
                ->get()
                ->keyBy(function ($s) {
                    $raw = str_replace([':AM', ':PM'], [' AM', ' PM'], $s->record_date);
                    return Carbon::parse($raw)->format('Y-m-d');
                });

            // 4) ดึง ยอดขายจาก sqlsrv2 (GoodID 2147: CPO, 2152: KN)
            $soPlansRaw = DB::connection('sqlsrv2')
                ->table('SOPlan')
                ->selectRaw("CONVERT(date, SOPDate) as SOPDate, GoodID, SUM(NetWei) as total_netwei")
                ->whereDate('SOPDate', '>=', $startOfMonth->format('Y-m-d'))
                ->whereDate('SOPDate', '<=', $endOfMonth->format('Y-m-d'))
                ->whereIn('GoodID', [2147, 2152])
                ->groupBy(DB::raw('CONVERT(date, SOPDate)'), 'GoodID')
                ->get();
                
            $salesByDateGoodId = [];
            foreach($soPlansRaw as $row) {
                $rawDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $row->SOPDate);
                $d = Carbon::parse($rawDate)->format('Y-m-d');
                $salesByDateGoodId[$d][$row->GoodID] = floatval($row->total_netwei) / 1000; // Tons
            }

            // 5) ข้อมูลย้อนหลัง 1 วันสำหรับยอดตั้งต้น CPO และ KN
            $prevCPOData = CPOData::whereDate('date', '<', $startOfMonth->format('Y-m-d'))
                ->orderBy('date', 'desc')
                ->first();
            $prevCPO = $prevCPOData ? floatval($prevCPOData->total_cpo) : 0;

            $prevKNData = StockProduct::whereDate('record_date', '<', $startOfMonth->format('Y-m-d'))
                ->orderBy('record_date', 'desc')
                ->first();
            $prevKN = $prevKNData ? floatval($prevKNData->pkn) : 0;

            // เตรียม Array Data สำหรับ Loop
            $tableData = [];
            $current = $startOfMonth->copy();
            
            while ($current->lte($endOfMonth)) {
                $dateStr = $current->format('Y-m-d');

                // ดึง Data ประจำวัน
                $prod = $productions->get($dateStr);
                $cpo = $cpoRecords->get($dateStr);
                $stock = $stockRecords->get($dateStr);

                // ดึง Sale
                $salesCPO = $salesByDateGoodId[$dateStr][2147] ?? 0;
                $salesKN = $salesByDateGoodId[$dateStr][2152] ?? 0;

                // ดึงตัวแปร Prod
                $ffbPurchase = $prod ? floatval($prod->FFBPurchase ?? 0) : 0;
                $ffbGoodQty = $prod ? floatval($prod->FFBGoodQty ?? 0) : 0;
                $skim = $cpo ? floatval($cpo->skim ?? 0) : 0;
                
                $currCPO = $cpo ? floatval($cpo->total_cpo ?? 0) : $prevCPO;
                $currKN = $stock ? floatval($stock->pkn ?? 0) : $prevKN;

                // การคำนวณ Yield CPO
                // ตาม controller เดิม: numerator = currentCPO - (previousCPO - salesCPOTons) - skim;
                $cpoProduced = $currCPO - ($prevCPO - $salesCPO) - $skim;
                $cpoYield = $ffbGoodQty > 0 ? round(($cpoProduced / $ffbGoodQty) * 100, 2) : 0;
                
                // การคำนวณ Yield KN
                $knProduced = $currKN - ($prevKN - $salesKN);
                $knYield = $ffbGoodQty > 0 ? round(($knProduced / $ffbGoodQty) * 100, 2) : 0;

                // อัพเดทยอดตั้งสำหรับลูปวันต่อไป
                $prevCPO = $currCPO;
                $prevKN = $currKN;

                $tableData[] = [
                    'date' => $dateStr,
                    'ffb_purchase' => round($ffbPurchase, 3),
                    'ffb_good_qty' => round($ffbGoodQty, 3),
                    
                    // หากมี product_cpo ใน DB ตรงๆ ให้ใช้ product_cpo ตาม Request
                    // แต่ในที่นี้เราสามารถใช้ product_cpo ที่บันทึกไว้ได้เลย
                    'product_cpo' => $cpo ? floatval($cpo->product_cpo) : round($cpoProduced, 3),
                    'yield_cpo' => $cpoYield,
                    
                    'product_kn' => round($knProduced, 3),
                    'yield_kn' => $knYield,
                    
                    'sales_cpo' => round($salesCPO, 3),
                    'sales_kn' => round($salesKN, 3),
                ];
                
                $current->addDay();
            }

            // ลำดับจากเก่าไปใหม่ตาม Request
            return response()->json([
                'success' => true,
                'data' => $tableData,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage(),
            ], 500);
        }
    }
}
