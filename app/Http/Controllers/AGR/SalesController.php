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
            $lastSequence = (int) substr($lastInvoice->invoice_no, -3);
            $newSequence = str_pad($lastSequence + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newSequence = '0001';
        }

        try {
            $validated = $request->validate([
                'sale_date' => 'required|date',
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
                'payment_slip' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
                'payment_status' => 'required|in:completed,partial,pending',
            ]);

            $lastId = AgrSale::max('id') + 1;
            $invoiceNo = $prefix . '-' . $newSequence;
            $validated['invoice_no'] = $invoiceNo;
            $validated['customer_id'] = $validated['customer_id'] !== null ? (int) $validated['customer_id'] : null;

            // คำนวณ total_amount
            $quantity = $validated['quantity'] ?? 0;
            $price = $validated['price'] ?? 0;
            $shippingCost = $validated['shipping_cost'] ?? 0;
            $validated['total_amount'] = ($quantity * $price) + $shippingCost;

            // ✅ คำนวณ deposit และ paid_amount ตาม payment_status
            $paymentStatus = $validated['payment_status'];
            $paidAmount = $validated['paid_amount'] ?? 0;
            $totalAmount = $validated['total_amount'];

            $paidAmount = max(0, min($paidAmount, $totalAmount));

            if ($paymentStatus === 'completed') {
                // ชำระเต็มจำนวน
                $validated['paid_amount'] = $totalAmount;
                $validated['deposit'] = 0;
            } elseif ($paymentStatus === 'partial') {
                // ชำระบางส่วน
                $validated['paid_amount'] = $paidAmount;
                $validated['deposit'] = $totalAmount - $paidAmount;
                // paid_amount ใช้ค่าจาก input
            } else {
                // ค้างชำระ
                $validated['paid_amount'] = 0;
                $validated['deposit'] = $totalAmount;
            }

            // คำนวณ deposit_percent
            if ($totalAmount > 0) {
                $validated['deposit_percent'] = ($validated['deposit'] / $totalAmount) * 100;
            } else {
                $validated['deposit_percent'] = 0;
            }

            $product = AgrProduct::findOrFail($validated['product_id']);
            $validated['store_id'] = $product->store_id;

            // ตรวจสอบสต็อกก่อนสร้างรายการ
            if ($quantity > $product->stock) {
                return redirect()->back()->with('error', 'จำนวนสินค้าที่สั่งเกินสต็อกที่มี (' . $product->stock . ' ชิ้น)');
            }

            // ✅ ตรวจสอบสถานะการชำระเงินอีกครั้ง (Double-check)
            if ($validated['paid_amount'] >= $totalAmount) {
                $validated['payment_status'] = 'completed';
                $validated['deposit'] = 0;
                $validated['deposit_percent'] = 0;
                $validated['paid_amount'] = $totalAmount; // ป้องกันการชำระเกิน
            }

            // ✅ หรือถ้าไม่ได้ชำระเลย ให้เป็น pending
            if ($validated['paid_amount'] <= 0) {
                $validated['payment_status'] = 'pending';
                $validated['deposit'] = $totalAmount;
                $validated['deposit_percent'] = 100;
            }

            $sale = AgrSale::create($validated);

            // ✅ จัดการไฟล์ payment_slip
            $slipPath = null;
            if ($request->hasFile('payment_slip')) {
                $slipPath = $request->file('payment_slip')->store('payment_slips', 'public');
            }

            // ✅ บันทึกข้อมูลลงใน agr_payments ตามเงื่อนไข
            $shouldCreatePayment = false;
            $paymentAmount = 0;

            if ($paymentStatus === 'completed') {
                // ชำระเต็มจำนวน → บันทึก payment จำนวนเต็ม
                $shouldCreatePayment = true;
                $paymentAmount = $totalAmount;
            } elseif ($paymentStatus === 'partial' && $paidAmount > 0) {
                // ชำระบางส่วน และมีจำนวนเงินที่ชำระ → บันทึก payment จำนวนที่ชำระ
                $shouldCreatePayment = true;
                $paymentAmount = $paidAmount;
            }
            // ค้างชำระ (pending) → ไม่สร้าง payment record

            if ($shouldCreatePayment) {
                AgrPayment::create([
                    'sale_id' => $sale->id,
                    'paid_at' => now(),
                    'amount' => $paymentAmount,
                    'new_payment' => $paymentAmount,
                    'method' => $validated['method'] ?? null,
                    'note' => $validated['note'] ?? 'การชำระเงินเริ่มต้น',
                    'payment_slip' => $slipPath,
                ]);
            }

            // อัพเดทสต็อกสินค้า
            $product->stock = $product->stock - $quantity;
            $product->save();

            return redirect()->back()->with('success', 'สร้างรายการขายเรียบร้อยแล้ว');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
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
                'payment_slip'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
                'payment_status' => 'nullable',
            ]);

            $sale = AgrSale::findOrFail($id);
            $oldProductId = $sale->product_id;
            $oldQuantity = $sale->quantity;

            // คำนวณ total_amount
            $quantity = $validated['quantity'] ?? 0;
            $price = $validated['price'] ?? 0;
            $shippingCost = $validated['shipping_cost'] ?? 0;
            $totalAmount = ($quantity * $price) + $shippingCost;
            $validated['total_amount'] = $totalAmount;

            // คำนวณยอดชำระรวมจากตาราง payments
            $totalPaid = AgrPayment::where('sale_id', $id)->sum('amount');
            $newPayment = $validated['new_payment'] ?? 0;

            // ถ้ามีการชำระเงินใหม่ ให้เพิ่มเข้าไปในยอดชำระรวม
            if ($newPayment > 0) {
                $totalPaid += $newPayment;
            }

            // ✅ คำนวณ payment_status อัตโนมัติตามยอดชำระ
            if ($totalPaid >= $totalAmount) {
                $validated['payment_status'] = 'completed';
                $validated['paid_amount'] = $totalAmount;
                $validated['deposit'] = 0;
            } elseif ($totalPaid > 0) {
                $validated['payment_status'] = 'partial';
                $validated['paid_amount'] = $totalPaid;
                $validated['deposit'] = $totalAmount - $totalPaid;
            } else {
                $validated['payment_status'] = 'pending';
                $validated['paid_amount'] = 0;
                $validated['deposit'] = $totalAmount;
            }

            // คำนวณ deposit_percent
            if ($totalAmount > 0) {
                $validated['deposit_percent'] = ($validated['deposit'] / $totalAmount) * 100;
            } else {
                $validated['deposit_percent'] = 0;
            }

            $product = AgrProduct::findOrFail($validated['product_id']);
            $validated['store_id'] = $product->store_id;

            // ตรวจสอบสต็อกก่อนอัพเดท (คำนึงถึงจำนวนเดิมที่เคยสั่ง)
            $availableStock = $product->stock;

            // ถ้าไม่เปลี่ยนสินค้า ให้เพิ่มสต็อกคืนจากจำนวนเดิมก่อนคำนวณใหม่
            if ($oldProductId == $validated['product_id']) {
                $availableStock += $oldQuantity;
            }

            if ($quantity > $availableStock) {
                return redirect()->back()->with('error', 'จำนวนสินค้าที่สั่งเกินสต็อกที่มี (' . $availableStock . ' ชิ้น)');
            }

            // ✅ จัดการไฟล์ payment_slip
            $slipPath = null;
            if ($request->hasFile('payment_slip')) {
                $slipPath = $request->file('payment_slip')->store('payment_slips', 'public');
            }

            // ✅ บันทึกข้อมูลการชำระเงินใหม่ (ถ้ามี)
            if ($newPayment > 0) {
                AgrPayment::create([
                    'sale_id' => $id,
                    'paid_at' => now(),
                    'amount' => $newPayment,
                    'new_payment' => $newPayment,
                    'method' => $validated['method'] ?? null,
                    'note' => $validated['note'] ?? 'การชำระเงินจากการอัพเดท',
                    'payment_slip' => $slipPath,
                ]);
            }

            // อัพเดทสต็อกสินค้า
            if ($oldProductId != $validated['product_id']) {
                // เปลี่ยนสินค้า - คืนสต็อกสินค้าเดิม
                $oldProduct = AgrProduct::find($oldProductId);
                if ($oldProduct) {
                    $oldProduct->stock += $oldQuantity;
                    $oldProduct->save();
                }
                // หักสต็อกสินค้าใหม่
                $product->stock -= $quantity;
            } else {
                // สินค้าเดิม - คำนวณสต็อกใหม่
                $product->stock = $availableStock - $quantity;
            }

            $product->save();

            // อัพเดทรายการขาย
            $sale->update($validated);

            return redirect()->back()->with('success', 'อัพเดทรายการขายเรียบร้อยแล้ว');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
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
