<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class StockController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('AgrSales/Stocks/Index', []);
    }
}
