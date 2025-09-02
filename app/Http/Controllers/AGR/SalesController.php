<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use App\Models\AGR\AgrSale;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SalesController extends Controller
{
    public function index(Request $request){
    $query = AgrSale::with('customer','items.product');

    // filters
    if($request->filled('q')){
      $q = $request->q;
      $query->whereHas('customer', fn($q2) => $q2->where('name','like',"%{$q}%"));
    }
    if($request->filled('status')) $query->where('status',$request->status);
    if($request->filled('from')) $query->whereDate('sale_date','>=',$request->from);
    if($request->filled('to')) $query->whereDate('sale_date','<=',$request->to);

    $sales = $query->orderBy('sale_date','desc')->paginate(10)->withQueryString();

    // cards: summary
    $today = today()->toDateString();
    $summary = [
      'today_sales' => AgrSale::whereDate('sale_date',$today)->sum('total_amount'),
      'month_sales' => AgrSale::whereMonth('sale_date', now()->month)->sum('total_amount'),
      'total_deposits' => AgrSale::sum('deposit'),
      'total_balance_due' => AgrSale::sum('balance_due'),
    ];

    return Inertia::render('AgrSales/Index', [
      'sales' => $sales,
      'summary' => $summary,
      'filters' => $request->only(['q','status','from','to']),
    ]);
}
}
