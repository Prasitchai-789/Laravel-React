<?php

namespace App\Http\Controllers\QAC;

use App\Http\Controllers\Controller;
use App\Models\PRO\Production;
use App\Models\QAC\CPOData;
use App\Models\QAC\ByProductionStock;
use App\Models\QAC\SiloRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MillDailyReportController extends Controller
{
    public function index()
    {
        return Inertia::render('QAC/MillDailyReport');
    }

    public function getData(Request $request)
    {
        $dateStr = $request->get('date', Carbon::now()->subDay()->format('Y-m-d'));
        $date = Carbon::parse($dateStr);
        $monthStart = $date->copy()->startOfMonth();

        // 1. FFB Data (Section A)
        $prod = Production::whereDate('Date', $date->format('Y-m-d'))->first();
        
        $mtdProduction = Production::whereBetween('Date', [$monthStart->format('Y-m-d'), $date->format('Y-m-d')])
            ->selectRaw('SUM(FFBPurchase) as total_received, SUM(FFBGoodQty) as total_milled')
            ->first();

        // 2. Oil Quality & Yield (Section B.1)
        $cpo = CPOData::whereDate('date', $date->format('Y-m-d'))->first();
        $mtdCpo = CPOData::whereBetween('date', [$monthStart->format('Y-m-d'), $date->format('Y-m-d')])
            ->selectRaw('SUM(product_cpo + purge_system) as total_oil_produced')
            ->first();

        // Section C: Despatch (Sales from sqlsrv2.SOPlan)
        $salesDaily = DB::connection('sqlsrv2')->table('SOPlan')
            ->selectRaw('GoodID, SUM(NetWei) as total_netwei')
            ->whereDate('SOPDate', $date->format('Y-m-d'))
            ->whereIn('GoodID', [2147, 2152, 2149, 2151, 9012])
            ->groupBy('GoodID')
            ->get()
            ->keyBy('GoodID');

        $salesMTD = DB::connection('sqlsrv2')->table('SOPlan')
            ->selectRaw('GoodID, SUM(NetWei) as total_netwei')
            ->whereBetween('SOPDate', [$monthStart->format('Y-m-d'), $date->format('Y-m-d')])
            ->whereIn('GoodID', [2147, 2152, 2149, 2151, 9012])
            ->groupBy('GoodID')
            ->get()
            ->keyBy('GoodID');

        // 3. Kernel (Section B.2) - Derived Production: (Stock Today - Stock Yesterday) + Sales Today
        $currentProducts = DB::table('stock_products')->whereDate('record_date', $date->format('Y-m-d'))->first();
        $previousProducts = DB::table('stock_products')->whereDate('record_date', '<', $date->format('Y-m-d'))
            ->orderBy('record_date', 'desc')->first();
        $monthStartProducts = DB::table('stock_products')->whereDate('record_date', '<', $monthStart->format('Y-m-d'))
            ->orderBy('record_date', 'desc')->first();

        $currentKN = $currentProducts ? (float)$currentProducts->pkn : 0;
        $previousKN = $previousProducts ? (float)$previousProducts->pkn : 0;
        $monthStartKN = $monthStartProducts ? (float)$monthStartProducts->pkn : 0;

        $salesKN_Daily = isset($salesDaily[2152]) ? (float)$salesDaily[2152]->total_netwei / 1000 : 0;
        $salesKN_MTD = isset($salesMTD[2152]) ? (float)$salesMTD[2152]->total_netwei / 1000 : 0;

        $kernelProduced_Daily = ($currentKN - ($previousKN - $salesKN_Daily));
        $kernelProduced_MTD = ($currentKN - ($monthStartKN - $salesKN_MTD));

        // 4. By-Products (Section B.3, B.4) & Silo Data
        $silo = SiloRecord::whereDate('record_date', $date->format('Y-m-d'))->first();
        $byProd = ByProductionStock::whereDate('production_date', $date->format('Y-m-d'))->first();
        $mtdByProd = ByProductionStock::whereBetween('production_date', [$monthStart->format('Y-m-d'), $date->format('Y-m-d')])
            ->selectRaw('SUM(efb_fiber_produced) as total_efb, SUM(shell_produced) as total_shell, SUM(efb_fiber_sold) as mtd_efb_sold, SUM(shell_sold) as mtd_shell_sold')
            ->first();

        // 5. Final Assembly
        $data = [
            'date' => $date->format('d/m/Y'),
            'ffb' => [
                'balance' => $prod ? (float)$prod->FFBForward : 0,
                'received' => $prod ? (float)$prod->FFBPurchase : 0,
                'milled' => $prod ? (float)$prod->FFBGoodQty : 0,
                'carry_forward' => $prod ? (float)$prod->FFBRemain : 0,
                'mtd_received' => (float)($mtdProduction->total_received ?? 0),
                'mtd_milled' => (float)($mtdProduction->total_milled ?? 0),
            ],
            'production' => [
                'oil' => [
                    'tons' => $cpo ? ($cpo->product_cpo + $cpo->purge_system) : 0,
                    'yield' => ($prod && $prod->FFBGoodQty > 0) ? round((($cpo->product_cpo ?? 0) + ($cpo->purge_system ?? 0)) / $prod->FFBGoodQty * 100, 2) : 0,
                    'ffa' => $cpo ? $cpo->ffa_cpo : 0,
                    'moisture' => $cpo ? $cpo->tank1_moisture : 0,
                    'dobi' => $cpo ? $cpo->dobi_cpo : 0,
                    'mtd_tons' => (float)($mtdCpo->total_oil_produced ?? 0),
                    'mtd_yield' => ($mtdProduction->total_milled > 0) ? round(($mtdCpo->total_oil_produced ?? 0) / $mtdProduction->total_milled * 100, 2) : 0,
                ],
                'kernel' => [
                    'tons' => $kernelProduced_Daily,
                    'yield' => ($prod && $prod->FFBGoodQty > 0) ? round($kernelProduced_Daily / $prod->FFBGoodQty * 100, 2) : 0,
                    'moisture' => $silo ? $silo->moisture_percent : 0,
                    'mtd_tons' => $kernelProduced_MTD,
                    'mtd_yield' => ($mtdProduction->total_milled > 0) ? round($kernelProduced_MTD / $mtdProduction->total_milled * 100, 2) : 0,
                ],
                'efb' => [
                    'tons' => $byProd ? (float)$byProd->efb_fiber_produced : 0,
                    'yield' => ($prod && $prod->FFBGoodQty > 0) ? round(($byProd->efb_fiber_produced ?? 0) / $prod->FFBGoodQty * 100, 2) : 0,
                    'mtd_tons' => (float)($mtdByProd->total_efb ?? 0),
                    'mtd_yield' => ($mtdProduction->total_milled ?? 0) > 0 ? round(($mtdByProd->total_efb ?? 0) / $mtdProduction->total_milled * 100, 2) : 0,
                ],
                'shell' => [
                    'tons' => $byProd ? (float)$byProd->shell_produced : 0,
                    'yield' => ($prod && $prod->FFBGoodQty > 0) ? round(($byProd->shell_produced ?? 0) / $prod->FFBGoodQty * 100, 2) : 0,
                    'mtd_tons' => (float)($mtdByProd->total_shell ?? 0),
                    'mtd_yield' => ($mtdProduction->total_milled ?? 0) > 0 ? round(($mtdByProd->total_shell ?? 0) / $mtdProduction->total_milled * 100, 2) : 0,
                ],
            ],
            'despatch' => [
                'oil' => [
                    'tons' => isset($salesDaily[2147]) ? (float)$salesDaily[2147]->total_netwei / 1000 : 0,
                    'mtd_tons' => isset($salesMTD[2147]) ? (float)$salesMTD[2147]->total_netwei / 1000 : 0,
                ],
                'kernel' => [
                    'tons' => isset($salesDaily[2152]) ? (float)$salesDaily[2152]->total_netwei / 1000 : 0,
                    'mtd_tons' => isset($salesMTD[2152]) ? (float)$salesMTD[2152]->total_netwei / 1000 : 0,
                ],
                'efb' => [
                    'tons' => isset($salesDaily[2149]) ? (float)$salesDaily[2149]->total_netwei / 1000 : 0,
                    'mtd_tons' => isset($salesMTD[2149]) ? (float)$salesMTD[2149]->total_netwei / 1000 : 0,
                ],
                'shell' => [
                    'tons' => ((isset($salesDaily[2151]) ? (float)$salesDaily[2151]->total_netwei : 0) + (isset($salesDaily[9012]) ? (float)$salesDaily[9012]->total_netwei : 0)) / 1000,
                    'mtd_tons' => ((isset($salesMTD[2151]) ? (float)$salesMTD[2151]->total_netwei : 0) + (isset($salesMTD[9012]) ? (float)$salesMTD[9012]->total_netwei : 0)) / 1000,
                ],
            ],
            'storage' => [
                'tanks' => [
                    ['name' => 'TANK NO. 1', 'tons' => 0, 'ffa' => 0, 'moisture' => 0, 'dobi' => 0],
                    ['name' => 'TANK NO. 2', 'tons' => $this->getVal($cpo, 'p_cpo'), 'ffa' => $this->getVal($cpo, 'tank2_top_ffa'), 'moisture' => $this->getVal($cpo, 'tank2_top_moisture'), 'dobi' => $this->getVal($cpo, 'tank2_top_dobi')],
                    ['name' => 'TANK NO. 3', 'tons' => 0, 'ffa' => 0, 'moisture' => 0, 'dobi' => 0],
                    ['name' => 'TANK NO. 4', 'tons' => 0, 'ffa' => 0, 'moisture' => 0, 'dobi' => 0],
                ],
                'silos' => [
                    ['name' => 'KERNEL SILO อบ NO.1', 'tons' => $silo ? $silo->kernel_silo_1_level : 0],
                    ['name' => 'KERNEL SILO อบ NO.2', 'tons' => $silo ? $silo->kernel_silo_2_level : 0],
                    ['name' => 'KERNEL SILO DESPATCH No.1', 'tons' => $silo ? $silo->silo_sale_big_level : 0],
                ],
                'by_products' => [
                    ['name' => 'EFB', 'tons' => $byProd ? $byProd->efb_fiber_balance : 0],
                    ['name' => 'SHELL', 'tons' => $byProd ? $byProd->shell_balance : 0],
                ],
            ],
            'remark' => [
                'buckets' => $prod ? ($prod->ShiftA + $prod->ShiftB + $prod->Shift3) : 0,
                'ton_per_bucket' => $prod ? (float)$prod->AvgPickup : 0,
            ],
            'additional_metrics' => [
                'feed_production' => $cpo ? (string)$cpo->feed_production : '',
                'despatch_oil' => $cpo ? (string)$cpo->despatch_oil : '',
                'despatch_tank' => $cpo ? (string)$cpo->despatch_tank : '',
            ],
        ];

        return response()->json($data);
    }

    public function saveAdditionalData(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'field' => 'required|string|in:feed_production,despatch_oil,despatch_tank',
            'value' => 'nullable'
        ]);

        $cpo = CPOData::whereDate('date', $validated['date'])->first();
        
        if (!$cpo) {
            $cpo = CPOData::create(['date' => $validated['date']]);
        }

        $cpo->update([
            $validated['field'] => $validated['value']
        ]);

        return response()->json(['success' => true, 'message' => 'Saved successfully']);
    }

    private function getVal($model, $field)
    {
        return $model ? (float)($model->{$field} ?? 0) : 0;
    }
}
