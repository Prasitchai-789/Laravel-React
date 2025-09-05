<?php

namespace App\Repositories;

use App\Models\WIN\SOInvDT;
use App\Models\WIN\SOInvHD;
use App\Models\WIN\SOHD;
use Illuminate\Support\Facades\DB;

class SalesRepository
{
    // ยอดขายรายเดือน - เพิ่มพารามิเตอร์ปีและเดือน
    public function getMonthlySales($year = null, $month = null)
    {
        $query = SOInvHD::selectRaw("FORMAT(DocuDate, 'yyyy-MM') as month, SUM(NetAmnt) as total")
            ->groupByRaw("FORMAT(DocuDate, 'yyyy-MM')")
            ->orderByRaw("FORMAT(DocuDate, 'yyyy-MM')");

        // กรองตามปีถ้ามีการกำหนด
        if ($year) {
            $query->whereYear('DocuDate', $year);
        }

        // กรองตามเดือนถ้ามีการกำหนด
        if ($month && $month !== 'all') {
            $query->whereMonth('DocuDate', $month);
        }

        return $query->get();
    }

    // Top 5 สินค้าขายดี - เพิ่มพารามิเตอร์ปีและเดือน
    public function getTopProducts($limit = 5, $year = null, $month = null)
    {
        $query = SOInvDT::select('GoodID')
            ->selectRaw('SUM(GoodQty2) as total_qty, SUM(GoodAmnt) as total_amount')
            ->with('good')
            ->groupBy('GoodID')
            ->orderByDesc('total_amount');

        // กรองตามปีและเดือนถ้ามีการกำหนด
        if ($year || $month) {
            $query->whereHas('invoice', function($q) use ($year, $month) {
                if ($year) {
                    $q->whereYear('DocuDate', $year);
                }
                if ($month && $month !== 'all') {
                    $q->whereMonth('DocuDate', $month);
                }
            });
        }

        return $query->take($limit)->get();
    }

    // Top 5 ลูกค้าสูงสุด - เพิ่มพารามิเตอร์ปีและเดือน
    public function getTopCustomers($limit = 5, $year = null, $month = null)
    {
        $query = SOInvHD::select('CustID')
            ->selectRaw('SUM(NetAmnt) as total_amount')
            ->with('customer')
            ->groupBy('CustID')
            ->orderByDesc('total_amount');

        // กรองตามปีและเดือนถ้ามีการกำหนด
        if ($year) {
            $query->whereYear('DocuDate', $year);
        }

        if ($month && $month !== 'all') {
            $query->whereMonth('DocuDate', $month);
        }

        return $query->take($limit)->get();
    }

    // Order vs Invoice (Conversion Rate) - เพิ่มพารามิเตอร์ปีและเดือน
    public function getOrderToInvoiceStats($year = null, $month = null)
    {
        $query = DB::connection('sqlsrv2')
            ->table('SOHD as s')
            ->leftJoin('SOInvHD as i', 's.DocuNo', '=', 'i.SONo');

        // กรองตามปีถ้ามีการกำหนด
        if ($year) {
            $query->whereYear('s.DocuDate', $year);
        }

        // กรองตามเดือนถ้ามีการกำหนด
        if ($month && $month !== 'all') {
            $query->whereMonth('s.DocuDate', $month);
        }

        $stats = $query->selectRaw('COUNT(DISTINCT s.DocuNo) as total_orders, COUNT(DISTINCT i.SONo) as converted_invoices')
            ->first();

        $conversionRate = $stats->total_orders > 0
            ? ($stats->converted_invoices / $stats->total_orders) * 100
            : 0;

        return [
            'total_orders' => $stats->total_orders,
            'converted_invoices' => $stats->converted_invoices,
            'conversion_rate' => round($conversionRate, 2),
        ];
    }

    // ฟังก์ชันเสริม: ดึงปีทั้งหมดที่มีข้อมูล
    public function getAvailableYears()
    {
        return SOInvHD::selectRaw('YEAR(DocuDate) as year')
            ->groupByRaw('YEAR(DocuDate)')
            ->orderBy('year', 'DESC')
            ->pluck('year');
    }
}
