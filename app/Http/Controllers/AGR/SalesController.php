<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use App\Models\AGR\AgrSale;
use Illuminate\Http\Request;
use App\Models\AGR\AgrPayment;
use App\Models\AGR\AgrProduct;
use App\Models\AGR\AgrCustomer;
use App\Models\AGR\LocationStore;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Container\Attributes\Auth;

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
        $payments = AgrPayment::all();
        return Inertia::render('AGR/Sales/Index', [
            'sales' => $sales,
            //   'summary' => $summary,
            'filters' => $request->only(['q', 'status', 'from', 'to']),
            'products' => $products,
            'locations' => $locations,
            'customers' => $customers,
            'payments' => $payments
        ]);
    }

    public function store(Request $request)
    {
        $yearShort = now()->format('y') + 43;
        $month = now()->format('m');
        $countInMonth = AgrSale::whereYear('sale_date', now()->year)
            ->whereMonth('sale_date', now()->month)
            ->count();

        $prefix = $yearShort . $month;
        $sequence = str_pad($countInMonth + 1, 3, '0', STR_PAD_LEFT);


        $lastInvoice = AgrSale::where('invoice_no', 'like', $prefix . '-%')
            ->orderBy('invoice_no', 'desc')
            ->first();

        if ($lastInvoice) {
            // แยกเลขลำดับจาก invoice_no เช่น 6809-005 → 005
            $lastSequence = (int) substr($lastInvoice->invoice_no, -3);
            $newSequence = str_pad($lastSequence + 1, 4, '0', STR_PAD_LEFT);
        } else {
            // ถ้ายังไม่มีเอกสารในเดือนนี้ เริ่มที่ 001
            $newSequence = '0001';
        }

        try {
            $validated = $request->validate([
                'sale_date' => 'required',
                // 'store_id' => 'required|integer',
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
                'method' => 'nullable|string|max:255',
                'note' => 'nullable|string',
                'new_payment' => 'nullable|numeric|min:0',
                'payment_slip'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048', // 2MB
            ]);

            $lastId = AgrSale::max('id') + 1;
            $invoiceNo = $prefix . '-' . $newSequence;
            $validated['invoice_no'] = $invoiceNo;
            $validated['customer_id'] = $validated['customer_id'] !== null ? (int) $validated['customer_id'] : null;
            $validated['total_amount'] = ($validated['quantity'] * $validated['price']) + $validated['shipping_cost'];

            $product = AgrProduct::findOrFail($validated['product_id']);
            $validated['store_id'] = $product->store_id;

            $sale = AgrSale::create($validated);

            // จัดการไฟล์
            $slipPath = null;
            if ($request->hasFile('payment_slip')) {
                $slipPath = $request->file('payment_slip')->store('payment_slips', 'public');
            }

            if (!empty($validated['paid_amount']) && $validated['paid_amount'] > 0) {
                AgrPayment::create([
                    'sale_id'   => $lastId,
                    'paid_at'   => now(),
                    'amount'    => $validated['paid_amount'],
                    'new_payment'    => $validated['paid_amount'] ?? null,
                    'method'      => $validated['method'] ?? null,
                    'note'      => $validated['note'] ?? null,
                    'payment_slip'  => $slipPath,
                ]);
            }

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
            dd($e);
            return redirect()->back()->withErrors($e->errors())->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated =  $request->validate([
                'sale_date' => 'required',
                // 'store_id' => 'required|integer',
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
                'method' => 'nullable|string|max:255',
                'note' => 'nullable|string',
                'new_payment' => 'nullable|numeric|min:0',
                'payment_slip'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048', // 2MB
            ]);

            $validated['total_amount'] = ($validated['quantity'] * $validated['price']) + $validated['shipping_cost'];

            $product = AgrProduct::findOrFail($validated['product_id']);
            $validated['store_id'] = $product->store_id;



            $sale = AgrSale::findOrFail($id);
            $sale->update($validated);

            $slipPath = null;
            if ($request->hasFile('payment_slip')) {
                $slipPath = $request->file('payment_slip')->store('payment_slips', 'public');
            }


            if (!empty($validated['paid_amount']) && $validated['paid_amount'] > 0) {
                AgrPayment::create([
                    'sale_id'   => $id,
                    'paid_at'   => now(),
                    'amount'    => $validated['paid_amount'],
                    'new_payment'    => $validated['new_payment'] ?? null,
                    'note'      => $validated['note'] ?? null,
                    'method'      => $validated['method'] ?? null,
                    'payment_slip'  => $slipPath,
                ]);
            }

            $product = AgrProduct::findOrFail($validated['product_id']);
            $quantity = $validated['quantity'] ?? 0;

            if ($quantity > $product->stock) {
                return redirect()->back()->with('error', 'จำนวนสินค้าที่สั่งเกินสต็อกที่มี (' . $product->stock . ' ชิ้น)');
            }

            // ถ้าไม่เกิน จึงลดสต็อก
            $product->stock -= $quantity;
            $product->save();

            // ✅ เพิ่มข้อมูลการจ่ายเงิน (ถ้ามีการจ่าย)


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


    public function show()
    {
        return Inertia::render('AGR/Sales/SalesReport');
    }
}
