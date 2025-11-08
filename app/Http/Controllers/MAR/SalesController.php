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

        return Inertia::render('MAR/SalesDashboard', [
        ]);

    }

    public function salesOrder()
    {

        return Inertia::render('MAR/SalesOrder', [
        ]);

    }
}
