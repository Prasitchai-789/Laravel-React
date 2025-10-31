<?php

namespace App\Http\Controllers\Api;

use App\Models\WIN\WebCity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class SalesAGRController extends Controller
{

    // public function reportBySubdistrict()
    // {
    //     $webCities = WebCity::select('SubDistrictID', 'SubDistrictName')->get()
    //         ->keyBy('SubDistrictID')
    //         ->map(fn($c) => $c->SubDistrictName);

    //     // ✅ กำหนด mapping SKU -> ชื่อเต็ม
    //     $skuNameMap = [
    //         'CR' => 'ซีหราดมิลเลนเนี่ยม',
    //         'KB' => 'โกลด์เด้น KB',
    //         'KB4' => 'โกลด์เด้น KB4',
    //     ];

    //     $rows = DB::connection('sqlsrv')
    //         ->table('agr_sales as s')
    //         ->join('agr_products as p', 's.product_id', '=', 'p.id')
    //         ->join('agr_customers as c', 's.customer_id', '=', 'c.id')
    //         ->select(
    //             'c.subdistrict',
    //             'p.sku',
    //             DB::raw('SUM(s.quantity) as total_quantity')
    //         )
    //         ->groupBy('c.subdistrict', 'p.sku')
    //         ->get();

    //     $pivot = [];
    //     foreach ($rows as $row) {
    //         $subId = $row->subdistrict ?: 'ไม่ระบุ';
    //         $subName = $webCities[$subId] ?? $subId;

    //         // ตัด prefix เช่น P4-CR → CR
    //         $shortSku = preg_replace('/^[^-]+-/', '', $row->sku);
    //         $productFullName = $skuNameMap[$shortSku] ?? $shortSku;
    //         $qty = $row->total_quantity;

    //         if (!isset($pivot[$subId])) {
    //             $pivot[$subId] = [
    //                 'subdistrict_id' => $subId,
    //                 'subdistrict' => $subName,
    //                 'total' => 0,
    //             ];
    //         }

    //         if (!isset($pivot[$subId][$productFullName])) {
    //             $pivot[$subId][$productFullName] = 0;
    //         }

    //         $pivot[$subId][$productFullName] += $qty;
    //         $pivot[$subId]['total'] += $qty;
    //     }

    //     // ✅ เรียงตาม total มากไปน้อย + เพิ่ม index
    //     $data = collect($pivot)->values()
    //         ->sortByDesc('total')
    //         ->values()
    //         ->map(function ($item, $index) {
    //             $item['index'] = $index + 1;
    //             return $item;
    //         });

    //     // ✅ ใช้ชื่อเต็มของสินค้าเป็นหัวคอลัมน์
    //     $products = collect($skuNameMap)->values();

    //     return response()->json([
    //         'products' => $products,
    //         'data' => $data,
    //     ]);
    // }

    public function reportBySubdistrict(Request $request)
    {
        $startDate = $request->get('start', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end', now()->format('Y-m-d'));

        $webCities = WebCity::select('SubDistrictID', 'SubDistrictName')->get()
            ->keyBy('SubDistrictID')
            ->map(fn($c) => $c->SubDistrictName);

        $skuNameMap = [
            'CR' => 'ซีหราดมิลเลนเนี่ยม',
            'KB' => 'โกลด์เด้น KB',
            'KB4' => 'โกลด์เด้น KB4',
        ];

        $rows = DB::connection('sqlsrv')
            ->table('agr_sales as s')
            ->join('agr_products as p', 's.product_id', '=', 'p.id')
            ->join('agr_customers as c', 's.customer_id', '=', 'c.id')
            ->select(
                'c.subdistrict',
                'p.sku',
                DB::raw('SUM(s.quantity) as total_quantity')
            )
            ->whereBetween('s.sale_date', [$startDate, $endDate])
            ->groupBy('c.subdistrict', 'p.sku')
            ->get();

        $pivot = [];
        foreach ($rows as $row) {
            $subId = $row->subdistrict ?: 'ไม่ระบุ';
            $subName = $webCities[$subId] ?? $subId;

            $shortSku = preg_replace('/^[^-]+-/', '', $row->sku);
            $productFullName = $skuNameMap[$shortSku] ?? $shortSku;
            $qty = $row->total_quantity;

            if (!isset($pivot[$subId])) {
                $pivot[$subId] = [
                    'subdistrict_id' => $subId,
                    'subdistrict' => $subName,
                    'total' => 0,
                ];
            }

            if (!isset($pivot[$subId][$productFullName])) {
                $pivot[$subId][$productFullName] = 0;
            }

            $pivot[$subId][$productFullName] += $qty;
            $pivot[$subId]['total'] += $qty;
        }

        $data = collect($pivot)->values()
            ->sortByDesc('total')
            ->values()
            ->map(function ($item, $index) {
                $item['index'] = $index + 1;
                return $item;
            });

        $products = collect($skuNameMap)->values();

        return response()->json([
            'products' => $products,
            'data' => $data,
        ]);
    }

    // เมธอดใหม่: สถิติการชำระเงิน
    public function paymentStats(Request $request)
    {
        $startDate = $request->get('start', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end', now()->format('Y-m-d'));

        $stats = DB::connection('sqlsrv')
            ->table('agr_sales')
            ->select(
                DB::raw('SUM(total_amount) as total_amount'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->first();

        return response()->json([
            'total_amount' => (float) ($stats->total_amount ?? 0),
            'transaction_count' => (int) ($stats->transaction_count ?? 0),
        ]);
    }


    // เมธอดใหม่: พื้นที่ที่มาซื้อมากที่สุด
    public function topAreas(Request $request)
    {
        $startDate = $request->get('start', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end', now()->format('Y-m-d'));

        // $startDate = '2023-01-01';
        // $endDate = '2024-12-31';

        $webCities = WebCity::select('SubDistrictID', 'SubDistrictName')->get()
            ->keyBy('SubDistrictID')
            ->map(fn($c) => $c->SubDistrictName);

        $areas = DB::connection('sqlsrv')
            ->table('agr_sales as s')
            ->join('agr_customers as c', 's.customer_id', '=', 'c.id')
            ->select(
                'c.subdistrict',
                DB::raw('SUM(s.quantity) as total_quantity'),
                DB::raw('SUM(s.total_amount) as total_amount'),
                DB::raw('COUNT(*) as total_orders')
            )
            ->whereBetween('s.sale_date', [$startDate, $endDate])
            ->groupBy('c.subdistrict')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(function ($item) use ($webCities) {
                return [
                    'subdistrict_id' => $item->subdistrict,
                    'subdistrict' => $webCities[$item->subdistrict] ?? $item->subdistrict,
                    'total_quantity' => $item->total_quantity,
                    'total_amount' => $item->total_amount,
                    'total_orders' => $item->total_orders,
                ];
            });

        return response()->json($areas);
    }

    public function summaryByProduct(Request $request)
    {
        $startDate = $request->get('start', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end', now()->format('Y-m-d'));

        $skuNameMap = [
            'CR' => 'ซีหราดมิลเลนเนี่ยม',
            'KB' => 'โกลด์เด้น KB',
            'KB4' => 'โกลด์เด้น KB4',
        ];

        // ดึงข้อมูลการขายทั้งหมด (ภายในช่วงวันที่)
        $sales = DB::connection('sqlsrv')
            ->table('agr_sales as s')
            ->join('agr_products as p', 's.product_id', '=', 'p.id')
            ->select(
                'p.sku',
                DB::raw('SUM(s.quantity) as total_qty'),
                DB::raw('SUM(s.total_amount) as total_amount')
            )
            ->when($startDate && $endDate, function ($query) use ($startDate, $endDate) {
                $query->whereBetween('s.sale_date', [$startDate, $endDate]);
            })
            ->groupBy('p.sku')
            ->get();
        // รวมข้อมูลโดยใช้ชื่อสินค้าเต็ม
        $summary = [];
        $grandQty = 0;
        $grandAmt = 0;

        foreach ($sales as $row) {
            // ดึงรหัส SKU สั้น เช่น P4-KB → KB
            $shortSku = preg_replace('/^[^-]+-/', '', $row->sku);
            $productName = $skuNameMap[$shortSku] ?? $shortSku;

            // ✅ ถ้ามีสินค้านี้อยู่แล้ว ให้บวกเพิ่ม
            if (!isset($summary[$productName])) {
                $summary[$productName] = [
                    'quantity' => 0,
                    'amount' => 0,
                ];
            }

            $summary[$productName]['quantity'] += (float) $row->total_qty;
            $summary[$productName]['amount'] += (float) $row->total_amount;

            $grandQty += (float) $row->total_qty;
            $grandAmt += (float) $row->total_amount;
        }

        return response()->json([
            'summary' => $summary,
            'grand_total' => [
                'quantity' => $grandQty,
                'amount' => $grandAmt,
            ],
        ]);
    }

    public function paymentMethodStats(Request $request)
    {
        $startDate = $request->get('start', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end', now()->format('Y-m-d'));

        try {
            // สถิติการชำระเงินแบ่งตาม method
            $methodStats = DB::connection('sqlsrv')
                ->table('agr_payments as p')
                ->join('agr_sales as s', 'p.sale_id', '=', 's.id')
                ->select(
                    'p.method',
                    DB::raw('SUM(p.amount) as total_paid'),
                    DB::raw('COUNT(*) as payment_count'),
                    DB::raw('AVG(p.amount) as avg_payment'),
                    DB::raw('MAX(p.amount) as max_payment'),
                    DB::raw('MIN(p.amount) as min_payment')
                )
                ->whereBetween('p.paid_at', [$startDate, $endDate])
                ->whereNotNull('p.method')
                ->where('p.method', '!=', '')
                ->groupBy('p.method')
                ->get();

            // สถิติรวม
            $totalStats = DB::connection('sqlsrv')
                ->table('agr_payments')
                ->select(
                    DB::raw('SUM(amount) as total_paid'),
                    DB::raw('COUNT(*) as total_payments'),
                    DB::raw('AVG(amount) as avg_payment')
                )
                ->whereBetween('paid_at', [$startDate, $endDate])
                ->first();

            // จัดกลุ่มข้อมูล - ใช้ key เป็น string ตามค่า method ใน database
            $methodData = [
                '1' => [ // เงินสด
                    'total_paid' => 0,
                    'payment_count' => 0,
                    'avg_payment' => 0,
                    'max_payment' => 0,
                    'min_payment' => 0,
                    'label' => 'เงินสด'
                ],
                '2' => [ // โอนเงิน
                    'total_paid' => 0,
                    'payment_count' => 0,
                    'avg_payment' => 0,
                    'max_payment' => 0,
                    'min_payment' => 0,
                    'label' => 'โอนเงิน'
                ],
                '3' => [ // บัตรเครดิต/เดบิต
                    'total_paid' => 0,
                    'payment_count' => 0,
                    'avg_payment' => 0,
                    'max_payment' => 0,
                    'min_payment' => 0,
                    'label' => 'บัตรเครดิต/เดบิต'
                ],
                '4' => [ // อื่นๆ
                    'total_paid' => 0,
                    'payment_count' => 0,
                    'avg_payment' => 0,
                    'max_payment' => 0,
                    'min_payment' => 0,
                    'label' => 'อื่นๆ'
                ]
            ];

            // แปลงข้อมูลจาก query มาใส่ใน methodData ตามค่า method
            foreach ($methodStats as $stat) {
                $methodValue = (string) $stat->method; // แปลงเป็น string เพื่อให้ตรงกับ key

                if (isset($methodData[$methodValue])) {
                    $methodData[$methodValue]['total_paid'] += (float) ($stat->total_paid ?? 0);
                    $methodData[$methodValue]['payment_count'] += (int) ($stat->payment_count ?? 0);
                    $methodData[$methodValue]['avg_payment'] = (float) ($stat->avg_payment ?? 0);
                    $methodData[$methodValue]['max_payment'] = (float) ($stat->max_payment ?? 0);
                    $methodData[$methodValue]['min_payment'] = (float) ($stat->min_payment ?? 0);
                }
            }

            // คำนวณ percentage
            $totalPaid = (float) ($totalStats->total_paid ?? 0);
            foreach ($methodData as $method => &$data) {
                $data['percentage'] = $totalPaid > 0 ?
                    round(($data['total_paid'] / $totalPaid) * 100, 2) : 0;
            }

            return response()->json([
                'summary' => [
                    'total_paid' => $totalPaid,
                    'total_payments' => (int) ($totalStats->total_payments ?? 0),
                    'avg_payment' => (float) ($totalStats->avg_payment ?? 0)
                ],
                'by_method' => $methodData,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการดึงข้อมูล',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
