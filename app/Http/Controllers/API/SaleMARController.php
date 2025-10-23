<?php

namespace App\Http\Controllers\Api;

use App\Models\MAR\SOPlan;
use App\Models\WIN\SOInvDT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SaleMARController extends Controller
{
    public function getSalesWeb(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');

            $data = SOPlan::selectRaw('GoodID, SUM(NetWei) as total_goodnet')
                ->whereBetween('SOPDate', [$start_date, $end_date])
                ->groupBy('GoodID')
                ->get();

            return response()->json(['status' => 'success', 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSalesWin(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            // กลุ่มขายสด ขายเชื่อ
            $sales = SOInvDT::selectRaw('GoodID, SUM(GoodAmnt) as total_amount')
                ->whereHas('invoice', function ($query) use ($start_date, $end_date) {
                    $query->whereBetween('DocuDate', [$start_date, $end_date])
                        ->whereIn('Docutype', [107, 108]);
                })
                ->groupBy('GoodID')
                ->get();

            // กลุ่มคืนสินค้า / ลดหนี้
            $returns = SOInvDT::selectRaw('GoodID, SUM(GoodAmnt) as total_amount')
                ->whereHas('invoice', function ($query) use ($start_date, $end_date) {
                    $query->whereBetween('DocuDate', [$start_date, $end_date])
                        ->whereIn('Docutype', [109]);
                })
                ->groupBy('GoodID')
                ->get();

            return response()->json([
                'status' => 'success',
                'sales' => $sales,
                'returns' => $returns
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSalesOrder(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            $good_id = $request->good_id ?? 2147;

            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            // ✅ ฟังก์ชันย่อยสำหรับยอดขาย/ลดหนี้
            $buildSalesQuery = function ($types) use ($start_date, $end_date, $good_id) {
                return SOInvDT::selectRaw('
                    SOInvDT.GoodID,
                    YEAR(invoice.DocuDate) as year,
                    MONTH(invoice.DocuDate) as month,
                    SUM(SOInvDT.GoodAmnt) as total_amount
                ')
                    ->join('SOInvHD as invoice', 'SOInvDT.SOInvID', '=', 'invoice.SOInvID')
                    ->whereBetween('invoice.DocuDate', [$start_date, $end_date])
                    ->whereIn('invoice.Docutype', $types)
                    ->when($good_id, fn($q) => $q->where('SOInvDT.GoodID', $good_id))
                    ->groupBy(
                        'SOInvDT.GoodID',
                        DB::raw('YEAR(invoice.DocuDate)'),
                        DB::raw('MONTH(invoice.DocuDate)')
                    )
                    ->orderBy(DB::raw('YEAR(invoice.DocuDate)'))
                    ->orderBy(DB::raw('MONTH(invoice.DocuDate)'))
                    ->get();
            };

            // ✅ ฟังก์ชันย่อยสำหรับน้ำหนัก
            $buildWeightQuery = function () use ($start_date, $end_date, $good_id) {
                return SOPlan::selectRaw('
                    SOPlan.GoodID,
                    YEAR(SOPDate) as year,
                    MONTH(SOPDate) as month,
                    SUM(NetWei) as total_weight
                ')
                    ->whereBetween('SOPDate', [$start_date, $end_date])
                    ->when($good_id, fn($q) => $q->where('GoodID', $good_id))
                    ->groupBy(
                        'SOPlan.GoodID',
                        DB::raw('YEAR(SOPDate)'),
                        DB::raw('MONTH(SOPDate)')
                    )
                    ->orderBy(DB::raw('YEAR(SOPDate)'))
                    ->orderBy(DB::raw('MONTH(SOPDate)'))
                    ->get();
            };

            // ✅ ดึงข้อมูลแต่ละส่วน
            $sales = $buildSalesQuery([107, 108]);
            $returns = $buildSalesQuery([109]);
            $weights = $buildWeightQuery();

            // ✅ จัดรูปแบบข้อมูลให้ง่ายต่อ frontend
            $grouped = [
                'sales' => $sales->groupBy('GoodID')->map(fn($items) => $items->map(fn($i) => [
                    'year' => $i->year,
                    'month' => $i->month,
                    'total_amount' => $i->total_amount,
                ])->values()),
                'returns' => $returns->groupBy('GoodID')->map(fn($items) => $items->map(fn($i) => [
                    'year' => $i->year,
                    'month' => $i->month,
                    'total_amount' => $i->total_amount,
                ])->values()),
                'weights' => $weights->groupBy('GoodID')->map(fn($items) => $items->map(fn($i) => [
                    'year' => $i->year,
                    'month' => $i->month,
                    'total_weight' => $i->total_weight,
                ])->values()),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $grouped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    public function getSalesSummary(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            $good_id = $request->good_id ?? null;

            if (!$start_date || !$end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'start_date หรือ end_date ไม่ถูกต้อง'
                ], 400);
            }

            // ✅ ฟังก์ชันย่อยสำหรับยอดขาย/ลดหนี้
            $buildSalesQuery = function ($types) use ($start_date, $end_date, $good_id) {
                return SOInvDT::selectRaw('
                    SOInvDT.GoodID,
                    YEAR(invoice.DocuDate) as year,
                    MONTH(invoice.DocuDate) as month,
                    SUM(SOInvDT.GoodAmnt) as total_amount
                ')
                    ->join('SOInvHD as invoice', 'SOInvDT.SOInvID', '=', 'invoice.SOInvID')
                    ->whereBetween('invoice.DocuDate', [$start_date, $end_date])
                    ->whereIn('invoice.Docutype', $types)
                    ->when($good_id, fn($q) => $q->where('SOInvDT.GoodID', $good_id))
                    ->groupBy(
                        'SOInvDT.GoodID',
                        DB::raw('YEAR(invoice.DocuDate)'),
                        DB::raw('MONTH(invoice.DocuDate)')
                    )
                    ->orderBy(DB::raw('YEAR(invoice.DocuDate)'))
                    ->orderBy(DB::raw('MONTH(invoice.DocuDate)'))
                    ->get();
            };

            // ✅ ฟังก์ชันย่อยสำหรับน้ำหนัก
            $buildWeightQuery = function () use ($start_date, $end_date, $good_id) {
                return SOPlan::selectRaw('
                    SOPlan.GoodID,
                    YEAR(SOPDate) as year,
                    MONTH(SOPDate) as month,
                    SUM(NetWei) as total_weight
                ')
                    ->whereBetween('SOPDate', [$start_date, $end_date])
                    ->when($good_id, fn($q) => $q->where('GoodID', $good_id))
                    ->groupBy(
                        'SOPlan.GoodID',
                        DB::raw('YEAR(SOPDate)'),
                        DB::raw('MONTH(SOPDate)')
                    )
                    ->orderBy(DB::raw('YEAR(SOPDate)'))
                    ->orderBy(DB::raw('MONTH(SOPDate)'))
                    ->get();
            };

            // ✅ ดึงข้อมูลแต่ละส่วน
            $sales = $buildSalesQuery([107, 108]);
            $returns = $buildSalesQuery([109]);
            $weights = $buildWeightQuery();

            // ✅ รวมยอดทั้งหมด (summary)
            $total_sales = $sales->sum('total_amount');
            $total_returns = $returns->sum('total_amount');
            $total_weight = $weights->sum('total_weight');
            $average_price = $total_weight > 0 ? round(($total_sales - $total_returns) / $total_weight, 2) : 0;

            // ✅ รวมข้อมูลต่อสินค้า
            $products = $sales->groupBy('GoodID')->map(function ($rows, $gid) use ($returns, $weights) {
                $sales_amount = $rows->sum('total_amount');
                $return_amount = $returns->where('GoodID', $gid)->sum('total_amount');
                $weight = $weights->where('GoodID', $gid)->sum('total_weight');
                $net = $sales_amount - $return_amount;
                $avg_price = $weight > 0 ? round($net / $weight, 2) : 0;
                return [
                    'good_id' => $gid,
                    'good_name' => $this->mapGoodName($gid),
                    'sales_amount' => $sales_amount,
                    'returns_amount' => $return_amount,
                    'net_sales' => $net,
                    'total_weight' => $weight,
                    'average_price' => $avg_price,
                    'production_ratio' => 0, // จะเติมทีหลัง
                ];
            })->values();

            $total_net = $products->sum('net_sales');
            $products = $products->map(function ($p) use ($total_net) {
                $p['production_ratio'] = $total_net > 0 ? round($p['net_sales'] / $total_net, 4) : 0;
                return $p;
            });

            // ✅ กรองสินค้าเฉพาะรายการที่มีชื่อกำหนดไว้
            $products = $products->filter(fn($p) => !is_null($p['good_name']))->values();

            // ✅ แนวโน้มรายเดือน (monthly trends)
            $monthly_trends = collect(range(1, 12))->map(function ($m) use ($sales, $returns, $weights) {
                $sales_m = $sales->where('month', $m)->sum('total_amount');
                $returns_m = $returns->where('month', $m)->sum('total_amount');
                $weight_m = $weights->where('month', $m)->sum('total_weight');
                $net_sales = $sales_m - $returns_m;
                $avg_price = $weight_m > 0 ? round($net_sales / $weight_m, 2) : 0;
                return [
                    'month' => date('Y') . '-' . str_pad($m, 2, '0', STR_PAD_LEFT),
                    'sales' => $sales_m,
                    'returns' => $returns_m,
                    'net_sales' => $net_sales,
                    'average_price' => $avg_price,
                    'weight' => $weight_m,
                ];
            });



            return response()->json([
                'summary' => [
                    'total_sales' => $total_sales,
                    'total_returns' => $total_returns,
                    'total_weight' => $total_weight,
                    'average_price' => $average_price,
                ],
                'products' => $products,
                'monthly_trends' => $monthly_trends,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ชื่อสินค้าชั่วคราว
    private function mapGoodName($id)
    {
        $names = [
            2147 => 'น้ำมันปาล์มดิบ',
            2152 => 'เมล็ดในปาล์ม',
            2151 => 'กะลา',
            9012 => 'ทะลายสับ',
            2149 => 'ทะลายปาล์มเปล่า',
            2150 => 'ใยปาล์ม',
        ];

        return $names[(int)$id] ?? null; // ✅ ถ้าไม่มี key นี้จะได้ null
    }

    public function getMarketPrice(Request $request)
    {
        try {
            $start_date = $request->start_date ?: date('Y-01-01');
            $end_date = $request->end_date ?: date('Y-m-d');
            $good_id = $request->good_id ?? 2147;

            // ตัวอย่าง mock (สามารถเปลี่ยนให้ดึงจากตารางราคาตลาดจริงได้)
            $series = collect(range(1, 12))->map(function ($m) {
                return [
                    'date' => date('Y') . '-' . str_pad($m, 2, '0', STR_PAD_LEFT),
                    'internal_price' => round(rand(1800, 2100) / 100, 2),
                    'market_price' => round(rand(1850, 2150) / 100, 2),
                ];
            });

            return response()->json(['series' => $series]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getTrends3Y(Request $request)
    {
        $good_id = $request->good_id ?? 2147;
        $end_year = $request->end_year ?? date('Y');

        $years = [$end_year - 2, $end_year - 1, $end_year];
        $lines = collect($years)->map(function ($y) use ($good_id) {
            $data = SOInvDT::selectRaw('MONTH(H.DocuDate) as month, SUM(SOInvDT.GoodAmnt) - SUM(CASE WHEN H.Docutype=109 THEN SOInvDT.GoodAmnt ELSE 0 END) as net_sales')
                ->join('SOInvHD as H', 'SOInvDT.SOInvID', '=', 'H.SOInvID')
                ->whereYear('H.DocuDate', $y)
                ->whereIn('H.Docutype', [107, 108, 109])
                ->when($good_id, fn($q) => $q->where('SOInvDT.GoodID', $good_id))
                ->groupBy(DB::raw('MONTH(H.DocuDate)'))
                ->orderBy(DB::raw('MONTH(H.DocuDate)'))
                ->get();

            return [
                'year' => $y,
                'points' => $data,
            ];
        });

        return response()->json(['lines' => $lines]);
    }


    public function getConversion(Request $request)
    {
        try {
            // สมมติว่าวัตถุดิบ 10,000 ตัน
            $input_ffb = 10000;
            $outputs = collect([
                ['good_id' => 2147, 'good_name' => 'น้ำมันปาล์มดิบ', 'weight' => 2100],
                ['good_id' => 2150, 'good_name' => 'เมล็ดในปาล์ม', 'weight' => 450],
                ['good_id' => 2151, 'good_name' => 'กะลา', 'weight' => 300],
                ['good_id' => 2152, 'good_name' => 'ทะลายสับ', 'weight' => 200],
                ['good_id' => 2153, 'good_name' => 'ทะลายปาล์มเปล่า', 'weight' => 350],
                ['good_id' => 2154, 'good_name' => 'ใยปาล์ม', 'weight' => 150],
            ]);

            $rates = $outputs->map(fn($o) => [
                'good_id' => $o['good_id'],
                'rate' => round($o['weight'] / $input_ffb, 3),
            ]);

            return response()->json([
                'input_ffb' => $input_ffb,
                'outputs' => $outputs,
                'rates' => $rates,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getLossAnalysis(Request $request)
    {
        $start = $request->start_date ?? date('Y-01-01');
        $end = $request->end_date ?? date('Y-m-d');

        $sales = SOInvDT::join('SOInvHD as H', 'SOInvDT.SOInvID', '=', 'H.SOInvID')
            ->whereBetween('H.DocuDate', [$start, $end])
            ->whereIn('H.Docutype', [107, 108])
            ->sum('SOInvDT.GoodAmnt');

        $returns = SOInvDT::join('SOInvHD as H', 'SOInvDT.SOInvID', '=', 'H.SOInvID')
            ->whereBetween('H.DocuDate', [$start, $end])
            ->where('H.Docutype', 109)
            ->sum('SOInvDT.GoodAmnt');

        // $reasons = DB::connection('sqlsrv2')
        //     ->table('ReasonReturn')
        //     ->select('ReasonName as reason', DB::raw('SUM(ReturnValue) as amount'))
        //     ->whereBetween('ReturnDate', [$start, $end])
        //     ->groupBy('ReasonName')
        //     ->get();

        return response()->json([
            'total_net_sales' => $sales - $returns,
            'total_returns' => $returns,
            'return_rate' => round($returns / $sales, 4),
            // 'by_reason' => $reasons,
        ]);
    }


    public function getTopCustomers(Request $request)
    {
        try {
            $limit = $request->limit ?? 5;

            // สามารถเปลี่ยนไป join จาก SOInvHD + EMVendor ได้
            $customers = collect([
                ['name' => 'บริษัท A', 'net_sales' => 9500000, 'volume' => 380, 'avg_price' => 25.0],
                ['name' => 'บริษัท B', 'net_sales' => 7600000, 'volume' => 310, 'avg_price' => 24.5],
                ['name' => 'บริษัท C', 'net_sales' => 5400000, 'volume' => 220, 'avg_price' => 24.6],
                ['name' => 'บริษัท D', 'net_sales' => 4200000, 'volume' => 180, 'avg_price' => 23.8],
                ['name' => 'บริษัท E', 'net_sales' => 3500000, 'volume' => 150, 'avg_price' => 23.3],
            ])->take($limit);

            return response()->json(['customers' => $customers]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
