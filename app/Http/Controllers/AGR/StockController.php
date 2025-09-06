<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\AGR\AgrProduct;
use App\Models\AGR\LocationStore;
use App\Http\Controllers\Controller;

class StockController extends Controller
{
    public function index(Request $request)
    {

    $products = AgrProduct::with('location')->get();
        $locations = LocationStore::all();
        return Inertia::render('AgrSales/Stocks/Index', [
            'locations' => $locations,
            'products' => $products
        ]);
    }
}
