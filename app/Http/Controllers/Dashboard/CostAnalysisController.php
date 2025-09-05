<?php

namespace App\Http\Controllers\Dashboard;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class CostAnalysisController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('startDate');
        $endDate   = $request->input('endDate');
        $goodIds   = [2152, 2149, 2151, 2147, 9012]; // GoodID ที่สนใจ

        // 1) ดึง certificates (sqlsrv3) -> filter coa_lot 6 หลัก
        $certLots = DB::connection('sqlsrv3')->table('certificates')
            ->select('coa_lot', 'coa_number', 'SOPID')
            ->whereBetween('date_coa', [
                $startDate . ' 00:00:00',
                $endDate . ' 23:59:59'
            ])
            ->get()
            ->map(fn($row) => (object)[
                'coa_lot' => preg_replace('/^QAC/', '', $row->coa_lot),
                'coa_number' => $row->coa_number,
                'SOPID' => $row->SOPID,
            ])
            ->filter(fn($row) => preg_match('/^\d{6}$/', $row->coa_lot));

        // 2) ดึงวันที่ผลิต SOPDate จาก SOPlan (sqlsrv2)
        $sopIds = $certLots->pluck('SOPID')->unique()->values();
        $sopDates = DB::connection('sqlsrv2')->table('SOPlan')
            ->whereIn('SOPID', $sopIds)
            ->pluck('SOPDate', 'SOPID');

        // 3) เตรียม DocuNo จาก coa_lot -> หา DocuID และ LotNo
        $docNos = $certLots->pluck('coa_lot')->map(fn($lot) => 'PRO' . $lot)->unique()->values();
        $docuIds = DB::connection('sqlsrv2')->table('ICStockHD')
            ->select(DB::raw("SUBSTRING(DocuNo, 1, CHARINDEX('-', DocuNo + '-') - 1) as DocuNoClean"), 'DocuID')
            ->whereIn(DB::raw("SUBSTRING(DocuNo, 1, CHARINDEX('-', DocuNo + '-') - 1)"), $docNos)
            ->pluck('DocuID', 'DocuNoClean');

        $lotNos = DB::connection('sqlsrv2')->table('ICStockDT')
            ->whereIn('DocuID', $docuIds->values())
            ->pluck('LotNo', 'DocuID');
        $lotNosSum = DB::connection('sqlsrv2')
            ->table('ICStockDT')
            ->whereIn('DocuID', $docuIds->values())
            ->select('DocuID', 'LotNo', 'GoodQty2', 'GoodAmnt')
            ->get()
            ->groupBy('DocuID');
        // 4) รับซื้อรวมจาก POInvDT ตาม LotNo
        $purchases = DB::connection('sqlsrv2')->table('POInvDT')
            ->select(
                'LotNo',
                DB::raw('SUM(COALESCE(GoodQty2,0)) as total_qty'),
                DB::raw('SUM(COALESCE(GoodAmnt,0)) as total_amnt')
            )
            ->groupBy('LotNo')
            ->get()
            ->keyBy('LotNo');
        // 5) รวมข้อมูล certificates กับ LotNo, DocuID, รับซื้อ, SOPDate
        $lotData = $certLots->map(function ($row) use ($docuIds, $lotNos, $purchases, $sopDates, $lotNosSum) {
            $docNo = 'PRO' . $row->coa_lot;
            $docuId = $docuIds[$docNo] ?? null;
            $lotNo = $docuId ? ($lotNos[$docuId] ?? null) : null;
            $purchase = $lotNo ? ($purchases[$lotNo] ?? null) : null;
            $lotNo_ffb = $lotNosSum->get($docuId);
            $lots = $docuId && isset($lotNosSum[$docuId]) ? $lotNosSum[$docuId] : collect();
            $purchase_ffb = $lots->map(function ($lot) use ($purchases) {
                $lotNo = $lot->LotNo;
                $purchase = $lotNo ? ($purchases[$lotNo] ?? null) : null;

                return [
                    'LotNo' => $lotNo,
                    'total_qty' => $purchase->total_qty ?? 0,
                    'total_amnt' => $purchase->total_amnt ?? 0,
                    'avg_cost_per_unit' => ($purchase && $purchase->total_qty > 0)
                        ? round($purchase->total_amnt / $purchase->total_qty, 2)
                        : 0,
                ];
            });
            // $lot_ffb_qty = $lotNosSum->get($docuId)->sum('GoodQty2') ?? 0;
            $lot_ffb_qty = $lotNosSum->get($docuId)?->sum('GoodQty2') ?? 0;


            return [
                'coa_lot' => $row->coa_lot,
                'coa_number' => $row->coa_number,
                'SOPID' => $row->SOPID,
                'SOPDate' => $sopDates[$row->SOPID] ?? null,
                'DocuNo' => $docNo,
                'DocuID' => $docuId,
                'ffb_pro_qty_sum' => $purchase_ffb->sum('total_qty') ?? 0,
                'ffb_pro_amnt_sum' => $purchase_ffb->sum('total_amnt') ?? 0,
                'ffb_pro_avg_cost_per_unit' => ($purchase_ffb->sum('total_qty') > 0)
                    ? round($purchase_ffb->sum('total_amnt') / $purchase_ffb->sum('total_qty'), 2)
                    : 0,
                'ffb_pro' => $lot_ffb_qty,
            ];
        });
        // dd($lotData);
        // 6) รวมยอดขายตามวันที่และ GoodID
        $sales = DB::connection('sqlsrv2')
            ->table('SOInvHD as hd')
            ->join('SOInvDT as dt', 'hd.SOInvID', '=', 'dt.SOInvID')
            ->select(
                'dt.GoodID',
                'dt.GoodName',
                DB::raw("CONVERT(date, hd.DocuDate) as DocuDate"),
                DB::raw('SUM(dt.GoodQty2) as total_qty'),
                DB::raw('SUM(dt.GoodAmnt) as total_amnt')
            )
            ->whereIn('dt.GoodID', $goodIds)
            ->whereBetween('hd.DocuDate', [$startDate, $endDate])
            ->groupBy('dt.GoodID', DB::raw('CAST(hd.DocuDate AS date)'), 'dt.GoodName')
            ->get()
            ->map(function ($row) {
                $dateStr = $row->DocuDate;
                $dateStr = str_replace(':AM', ' AM', $dateStr);
                $dateStr = str_replace(':PM', ' PM', $dateStr);
                $date = Carbon::parse($dateStr);
                return [
                    'GoodID' => $row->GoodID,
                    'GoodName' => $row->GoodName,
                    'DocuDate' => $date->format('Y-m-d'),
                    'total_qty' => $row->total_qty,
                    'total_amnt' => $row->total_amnt,
                    'avg_sale_price' => $row->total_qty > 0 ? round($row->total_amnt / $row->total_qty, 2) : 0,
                ];
            });

        // สมมติ $lotData คือข้อมูล array 107 ที่ได้มา
        $uniqueLotData = collect($lotData)
            ->unique('DocuNo') // กรองให้เหลือ DocuNo ไม่ซ้ำ
            ->map(function ($item) {
                return [
                    'DocuNo' => $item['DocuNo'],
                    'productionDate' => $item['SOPDate'],
                    'productionQty' => $item['ffb_pro'],

                    'unitCost' => $item['ffb_pro_avg_cost_per_unit'],
                    'totalCost' => $item['ffb_pro'] > 0
                        ? $item['ffb_pro_avg_cost_per_unit'] * $item['ffb_pro']
                        : 0,
                ];
            })
            ->values(); // reset key
        // 8) Return data to Inertia (React)
        return Inertia::render('Dashboard/CostAnalysis/Index', [
            'lotData' => $uniqueLotData->toArray(), // แปลงเป็น array
            'sales' => $sales->toArray(),
            'uniqueLotData' => $uniqueLotData->toArray()   // แปลงเป็น array
        ]);
    }
}
