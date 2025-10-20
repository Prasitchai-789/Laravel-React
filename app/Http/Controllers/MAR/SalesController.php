<?php

namespace App\Http\Controllers\MAR;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Repositories\SalesRepository;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    protected $salesRepo;

    public function __construct(SalesRepository $salesRepo)
    {
        $this->salesRepo = $salesRepo;
    }

    public function index()
    {
        // // รับค่ากรองจาก query parameters
        // $year = $request->get('year', null);
        // $month = $request->get('month', null);

        // // แปลงค่า 'all' เป็น null
        // if ($year === 'all') $year = null;
        // if ($month === 'all') $month = null;

        // $monthlySales = $this->salesRepo->getMonthlySales($year, $month);
        // $topProducts = $this->salesRepo->getTopProducts(5, $year, $month);
        // $topCustomers = $this->salesRepo->getTopCustomers(5, $year, $month);
        // $conversionStats = $this->salesRepo->getOrderToInvoiceStats($year, $month);
        // $availableYears = $this->salesRepo->getAvailableYears();

        return Inertia::render('MAR/Dashboard', [
            // 'monthlySales'    => $monthlySales,
            // 'topProducts'     => $topProducts,
            // 'topCustomers'    => $topCustomers,
            // 'conversionStats' => $conversionStats,
            // 'availableYears'  => $availableYears,
            // 'filters' => [
            //     'year' => $year,
            //     'month' => $month
            // ]
        ]);
    }
}
