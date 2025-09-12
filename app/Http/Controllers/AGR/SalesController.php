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
        // $query = AgrSale::with('customer'   );

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
                'quantity' => 'nullable|integer|min:0',
                'price' => 'required|numeric|min:0',
                'status' => 'required|in:reserved,completed,cancelled',
                'total_amount' => 'nullable|numeric|min:0',
                'paid_amount' => 'nullable|numeric|min:0',
                'deposit' => 'nullable|numeric|min:0',
                'shipping_cost' => 'nullable|numeric|min:0',
                'deposit_percent' => 'nullable|numeric|min:0|max:100',
            ]);

            $lastId = AgrSale::max('id') + 1;
            $validated['invoice_no'] = 'INV-' . now()->format('Ymd') . '-' . str_pad($lastId, 4, '0', STR_PAD_LEFT);
            $validated['customer_id'] = $validated['customer_id'] !== null ? (int) $validated['customer_id'] : null;
            $validated['total_amount'] = ($validated['quantity'] * $validated['price']) + $validated['shipping_cost'];

            $sale = AgrSale::create($validated);

            $product = AgrProduct::findOrFail($validated['product_id']);
            $quantity = $validated['quantity'] ?? 0;

            if ($quantity > $product->stock) {
                return redirect()->back()->with('error', 'จำนวนสินค้าที่สั่งเกินสต็อกที่มี (' . $product->stock . ' ชิ้น)');
            }

            // ถ้าไม่เกิน จึงลดสต็อก
            $product->stock = $product->stock - $quantity;
            $product->save();

            return redirect()->back()->with('success', 'สร้างรายการขายเรียบร้อยแล้ว');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated =  $request->validate([
                'sale_date' => 'required',
                'store_id' => 'required|integer',
                'product_id' => 'required|integer',
                'customer_id' => 'nullable|integer',
                'quantity' => 'nullable|integer|min:0',
                'price' => 'required|numeric|min:0',
                'status' => 'required|in:reserved,completed,cancelled',
                'total_amount' => 'nullable|numeric|min:0',
                'paid_amount' => 'nullable|numeric|min:0',
                'deposit' => 'nullable|numeric|min:0',
                'shipping_cost' => 'nullable|numeric|min:0',
                'deposit_percent' => 'nullable|numeric|min:0|max:100',
            ]);

            $validated['total_amount'] = ($validated['quantity'] * $validated['price']) + $validated['shipping_cost'];

            $sale = AgrSale::findOrFail($id);
            $sale->update($validated);

            $product = AgrProduct::findOrFail($validated['product_id']);
            $quantity = $validated['quantity'] ?? 0;

            if ($quantity > $product->stock) {
                return redirect()->back()->with('error', 'จำนวนสินค้าที่สั่งเกินสต็อกที่มี (' . $product->stock . ' ชิ้น)');
            }

            // ถ้าไม่เกิน จึงลดสต็อก
            $product->stock = $product->stock - $quantity;
            $product->save();

            return redirect()->back()->with('success', 'updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            dd($e);
            return redirect()->back()->withErrors($e->errors())->withInput();
        }
    }

    public function destroy($id)
    {
        AgrSale::destroy($id);
        return redirect()->back()->with('success', 'deleted successfully');
    }
}
