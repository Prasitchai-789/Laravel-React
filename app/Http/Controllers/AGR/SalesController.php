<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use App\Models\AGR\AgrSale;
use Illuminate\Http\Request;
use App\Models\AGR\AgrProduct;
use App\Models\AGR\AgrCustomer;
use App\Models\AGR\LocationStore;
use App\Http\Controllers\Controller;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        $products = AgrProduct::all();
        $locations = LocationStore::all();
        $customers = AgrCustomer::all();
        // $query = AgrSale::with('customer','items.product');

        // // filters
        // if($request->filled('q')){
        //   $q = $request->q;
        //   $query->whereHas('customer', fn($q2) => $q2->where('name','like',"%{$q}%"));
        // }
        // if($request->filled('status')) $query->where('status',$request->status);
        // if($request->filled('from')) $query->whereDate('sale_date','>=',$request->from);
        // if($request->filled('to')) $query->whereDate('sale_date','<=',$request->to);

        // $sales = $query->orderBy('sale_date','desc')->paginate(10)->withQueryString();

        // // cards: summary
        // $today = today()->toDateString();
        // $summary = [
        //   'today_sales' => AgrSale::whereDate('sale_date',$today)->sum('total_amount'),
        //   'month_sales' => AgrSale::whereMonth('sale_date', now()->month)->sum('total_amount'),
        //   'total_deposits' => AgrSale::sum('deposit'),
        //   'total_balance_due' => AgrSale::sum('balance_due'),
        // ];
        $sales = AgrSale::all();
        return Inertia::render('AGR/Sales/Index', [
            'sales' => $sales,
            //   'summary' => $summary,
            'filters' => $request->only(['q', 'status', 'from', 'to']),
            'products' => $products,
            'locations' => $locations,
            'customers' => $customers
        ]);
    }

    public function store(Request $request)
    {

        try {
            $validated = $request->validate([
                'sale_date' => 'required',
                'store_id' => 'required|integer',
                'product_id' => 'required|integer',
                'customer_id' => 'nullable|integer',
                'status' => 'required',
                'total_amount' => 'nullable|numeric|min:0',
                'deposit' => 'nullable|numeric|min:0',
                'deposit_percent' => 'nullable|numeric|min:0|max:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        }
        $lastId = AgrSale::max('id') + 1;
        $validated['invoice_no'] = 'INV-' . now()->format('Ymd') . '-' . str_pad($lastId, 4, '0', STR_PAD_LEFT);
        $validated['customer_id'] = $validated['customer_id'] !== null ? (int) $validated['customer_id'] : null;

        // สร้าง sale
        $sale = AgrSale::create($validated);

        return redirect()->back()->with('success', 'สร้างรายการขายเรียบร้อยแล้ว');
    }
}
