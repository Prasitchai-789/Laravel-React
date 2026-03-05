<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use App\Models\AGR\AgrSale;
use App\Models\AGR\AgrSaleItem;
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
        $yearShort = now()->format('y') + 43;
        $month = now()->format('m');
        $prefix = $yearShort . $month;

        // ค้นหาเลขที่ล่าสุด ทั้งแบบใช้ - และ / เพื่อความยืดหยุ่นในการย้ายระบบ
        $invoices = AgrSale::where(function($q) use ($prefix) {
                $q->where('invoice_no', 'like', $prefix . '-%')
                  ->orWhere('invoice_no', 'like', $prefix . '/%');
            })
            ->pluck('invoice_no');

        $maxSequence = 0;
        foreach ($invoices as $inv) {
            $separator = strpos($inv, '/') !== false ? '/' : '-';
            $parts = explode($separator, $inv);
            if (count($parts) > 1) {
                $seq = (int) end($parts);
                if ($seq > $maxSequence) $maxSequence = $seq;
            }
        }
        
        $newSequence = str_pad($maxSequence + 1, 4, '0', STR_PAD_LEFT);
        $nextReference = $prefix . '/' . $newSequence;

        $sales = AgrSale::with(['items', 'payments'])->orderBy('id', 'desc')->get();
        $payments = AgrPayment::all();
        return Inertia::render('AGR/Sales/Index', [
            'sales' => $sales,
            //   'summary' => $summary,
            'filters' => $request->only(['q', 'status', 'from', 'to']),
            'products' => $products,
            'locations' => $locations,
            'customers' => $customers,
            'payments' => $payments,
            'next_reference' => $nextReference
        ]);
    }

    public function store(Request $request)
    {
        if ($request->filled('invoice_no')) {
            $invoiceNo = $request->invoice_no;
        } else {
            $yearShort = now()->format('y') + 43;
            $month = now()->format('m');
            $prefix = $yearShort . $month;

            $lastInvoice = AgrSale::where(function($q) use ($prefix) {
                    $q->where('invoice_no', 'like', $prefix . '-%')
                      ->orWhere('invoice_no', 'like', $prefix . '/%');
                })
                ->orderBy('invoice_no', 'desc')
                ->first();

            if ($lastInvoice) {
                $separator = strpos($lastInvoice->invoice_no, '/') !== false ? '/' : '-';
                $parts = explode($separator, $lastInvoice->invoice_no);
                $lastSequence = count($parts) > 1 ? (int) end($parts) : 0;
                $newSequence = str_pad($lastSequence + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $newSequence = '0001';
            }
            $invoiceNo = $prefix . '/' . $newSequence;
        }

        try {
            $validated = $request->validate([
                'sale_date' => 'required|date',
                'invoice_no' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|integer',
                'items.*.custom_product_id' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0.1',
                'items.*.price' => 'required|numeric|min:0',
                'customer_id' => 'required|integer',
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
                // Backward compatibility fields
                'quantity' => 'nullable|numeric|min:0',
                'price' => 'nullable|numeric|min:0',
                'product_id' => 'nullable|integer',
            ]);

            $lastId = AgrSale::max('id') + 1;
            $validated['customer_id'] = $validated['customer_id'] !== null ? (int) $validated['customer_id'] : null;

            $items = $validated['items'];
            $shippingCost = $validated['shipping_cost'] ?? 0;
            $totalPaymentFromInput = current(array_filter([$validated['paid_amount'] ?? 0, collect($items)->sum(function($i) { return $i['quantity'] * $i['price']; }) ])) ?? 0;
            if (isset($validated['paid_amount'])) {
                $totalPaymentFromInput = $validated['paid_amount'];
            }
            
            // เตรียมข้อมูลสินค้าเพื่อตรวจเช็คสต็อก
            $productsToUpdate = [];
            foreach ($items as $item) {
                $pid = $item['product_id'];
                $qty = $item['quantity'];
                if(!isset($productsToUpdate[$pid])) {
                    $productModel = AgrProduct::findOrFail($pid);
                    $productsToUpdate[$pid] = [
                        'model' => $productModel,
                        'required_qty' => 0
                    ];
                }
                $productsToUpdate[$pid]['required_qty'] += $qty;
            }

            // ตรวจสอบสต็อกก่อนสร้างรายการทั้งหมด
            foreach ($productsToUpdate as $pid => $pData) {
                $product = $pData['model'];
                if ($pData['required_qty'] > $product->stock) {
                    return redirect()->back()->with('error', 'สินค้า "' . $product->name . '" มีจำนวนสั่งซื้อเกินสต็อกที่มี (' . $product->stock . ' ชิ้น)');
                }
            }

            // ✅ จัดการไฟล์ payment_slip
            $slipPath = null;
            if ($request->hasFile('payment_slip')) {
                $slipPath = $request->file('payment_slip')->store('payment_slips', 'public');
            }

            DB::beginTransaction();

            $items = $validated['items'];
            $itemsTotal = collect($items)->sum(function($i) { return $i['quantity'] * $i['price']; });
            $shippingCost = floatval($validated['shipping_cost'] ?? 0);
            $totalAmount = $itemsTotal + $shippingCost;
            $paidAmount = floatval($validated['paid_amount'] ?? 0);
            $deposit = max(0, $totalAmount - $paidAmount);
            $depositPercent = $totalAmount > 0 ? ($deposit / $totalAmount) * 100 : 0;
            
            $paymentStatus = 'pending';
            if ($paidAmount >= $totalAmount && $totalAmount > 0) {
                $paymentStatus = 'completed';
            } else if ($paidAmount > 0) {
                $paymentStatus = 'partial';
            }

            // Get Next Invoice Number
            if ($request->filled('invoice_no')) {
                $invoiceNo = $request->invoice_no;
            } else {
                $yearShort = now()->format('y') + 43;
                $month = now()->format('m');
                $prefix = $yearShort . $month;

                $invoices = AgrSale::where(function($q) use ($prefix) {
                        $q->where('invoice_no', 'like', $prefix . '-%')
                        ->orWhere('invoice_no', 'like', $prefix . '/%');
                    })
                    ->pluck('invoice_no');

                $maxSequence = 0;
                foreach ($invoices as $inv) {
                    $separator = strpos($inv, '/') !== false ? '/' : '-';
                    $parts = explode($separator, $inv);
                    if (count($parts) > 1) {
                        $seq = (int) end($parts);
                        if ($seq > $maxSequence) $maxSequence = $seq;
                    }
                }
                
                $newSequence = str_pad($maxSequence + 1, 4, '0', STR_PAD_LEFT);
                $invoiceNo = $prefix . '/' . $newSequence;
            }

            $firstItem = $items[0];
            $productModel = $productsToUpdate[$firstItem['product_id']]['model'];

            // Create ONE Sale Header
            $saleData = array_merge($validated, [
                'invoice_no' => $invoiceNo,
                'product_id' => $firstItem['product_id'],
                'custom_product_id' => $firstItem['custom_product_id'] ?? null,
                'quantity' => $firstItem['quantity'],
                'price' => $firstItem['price'],
                'shipping_cost' => $shippingCost,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'deposit' => $deposit,
                'deposit_percent' => $depositPercent,
                'payment_status' => $paymentStatus,
                'store_id' => $productModel->store_id,
            ]);
            unset($saleData['items']);
            $sale = AgrSale::create($saleData);

            // Create multiple items and update stock
            $createdItems = [];
            foreach ($items as $item) {
                $lineTotal = $item['quantity'] * $item['price'];
                
                $saleItem = AgrSaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'custom_product_id' => $item['custom_product_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'line_total' => $lineTotal,
                    'paid_amount' => 0,
                    'payment_status' => 'pending',
                ]);
                $createdItems[] = $saleItem;

                // Stock update
                $prod = $productsToUpdate[$item['product_id']]['model'];
                $prod->stock -= $item['quantity'];
                $prod->save();
            }

            // Create Payment record and distribute to items proportionally
            if ($paidAmount > 0) {
                // กระจายยอดชำระตามสัดส่วนของแต่ละ item
                $remainingPayment = $paidAmount;
                foreach ($createdItems as $idx => $saleItem) {
                    if ($totalAmount > 0) {
                        $proportion = $saleItem->line_total / $totalAmount;
                        // item สุดท้ายรับส่วนที่เหลือเพื่อไม่ให้เกิดปัดเศษผิด
                        $itemPayment = ($idx === count($createdItems) - 1)
                            ? $remainingPayment
                            : round($paidAmount * $proportion, 2);
                        $itemPayment = min($itemPayment, $remainingPayment);
                    } else {
                        $itemPayment = 0;
                    }

                    if ($itemPayment > 0) {
                        AgrPayment::create([
                            'sale_id' => $sale->id,
                            'sale_item_id' => $saleItem->id,
                            'paid_at' => now(),
                            'amount' => $itemPayment,
                            'new_payment' => $itemPayment,
                            'method' => $validated['method'] ?? null,
                            'note' => $validated['note'] ?? 'การชำระเงินเริ่มต้น',
                            'payment_slip' => $slipPath,
                        ]);

                        $saleItem->paid_amount = $itemPayment;
                        $saleItem->recalcPaymentStatus();
                        $remainingPayment -= $itemPayment;
                    }
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'บันทึกการขายเรียบร้อยแล้ว');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('SALE CREATE ERROR: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'sale_date' => 'required|date',
                'invoice_no' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|integer',
                'items.*.custom_product_id' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0.1',
                'items.*.price' => 'required|numeric|min:0',
                'customer_id' => 'required|integer',
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
                'payment_status' => 'nullable',
                // Item-level payments
                'item_payments' => 'nullable|array',
                'item_payments.*.sale_item_id' => 'required|integer',
                'item_payments.*.amount' => 'required|numeric|min:0',
                // Backward compatibility fields
                'quantity' => 'nullable|numeric|min:0',
                'price' => 'nullable|numeric|min:0',
                'product_id' => 'nullable|integer',
            ]);

            $sale = AgrSale::findOrFail($id);
            $items = $validated['items'];
            $itemsQuantity = 0;
            
            // เตรียมการอัพเดทสต็อก (คืนสต็อกเก่า ชาร์จสต็อกใหม่)
            $oldItems = AgrSaleItem::where('sale_id', $sale->id)->get();
            
            // ถ้าไม่มีใน items (ระบบเก่าที่ยังไม่มีใน db) ใช้ค่าจาก sale เดิมเป็น baseline
            if($oldItems->isEmpty() && $sale->product_id) {
                $oldItems = collect([(object)[
                    'product_id' => $sale->product_id,
                    'quantity' => $sale->quantity
                ]]);
            }

            $stockAdjustments = []; // product_id => [old_qty, new_qty]

            // ใส่ค่าเก่าเข้าไปก่อนเพื่อเป็น baseline สำหรับการคืนค่า stock
            foreach ($oldItems as $oItem) {
                $pid = $oItem->product_id;
                if(!isset($stockAdjustments[$pid])) {
                    $stockAdjustments[$pid] = ['old' => 0, 'new' => 0];
                }
                $stockAdjustments[$pid]['old'] += $oItem->quantity;
            }

            // คำนวณค่าใหม่
            foreach ($items as $item) {
                $pid = $item['product_id'];
                $qty = $item['quantity'];
                
                if(!isset($stockAdjustments[$pid])) {
                    $stockAdjustments[$pid] = ['old' => 0, 'new' => 0];
                }
                $stockAdjustments[$pid]['new'] += $qty;
                $itemsQuantity += $qty;
            }

            $items = $validated['items'];
            $shippingCost = $validated['shipping_cost'] ?? 0;
            
            // ✅ คำนวณยอดรวมจากทุกรายการสินค้า
            $itemsTotalSum = 0;
            foreach ($items as $item) {
                $itemsTotalSum += ($item['quantity'] * $item['price']);
            }
            $totalAmount = $itemsTotalSum + $shippingCost;

            $firstItem = $items[0];

            // คำนวณยอดชำระรวมเบื้องต้น (จะคำนวณใหม่อีกครั้งหลังเพิ่ม payment ใหม่)
            $totalPaid = AgrPayment::where('sale_id', $id)->sum('amount');

            // กำหนด store_id หลักของ sale โดยอ้างอิงจากสินค้าชิ้นแรก
            $storeId = $sale->store_id;
            $firstProduct = AgrProduct::find($firstItem['product_id']);
            if($firstProduct) $storeId = $firstProduct->store_id;

            // ตรวจสอบสต็อกก่อนอัพเดทจริง
            $productsModels = [];
            foreach ($stockAdjustments as $pid => $adj) {
                $product = AgrProduct::find($pid);
                if($product) {
                    $productsModels[$pid] = $product;
                    
                    // คำนวณ stock คงเหลือหลังคืนค่า stock เก่าและหัก stock ใหม่
                    $projectedStock = $product->stock + $adj['old'] - $adj['new'];
                    if ($projectedStock < 0) {
                        return redirect()->back()->with('error', 'สินค้า "' . $product->name . '" มีไม่เพียงพอ (สต็อกที่มีตอนนี้รวมกับที่ล็อกไว้อาจไม่พอ)');
                    }
                }
            }

            // ✅ จัดการไฟล์ payment_slip
            $slipPath = null;
            if ($request->hasFile('payment_slip')) {
                $slipPath = $request->file('payment_slip')->store('payment_slips', 'public');
            }

            DB::beginTransaction();

            $id = $sale->id;
            $originalInvoiceNo = $sale->invoice_no;
            $newInvoiceNo = $request->filled('invoice_no') ? $request->invoice_no : $originalInvoiceNo;

            // ✅ บันทึกข้อมูลการชำระเงินใหม่ (แยกรายสินค้า)
            $itemPayments = $validated['item_payments'] ?? [];
            $newPayment = $validated['new_payment'] ?? 0;

            \Illuminate\Support\Facades\Log::info('PayForm UPDATE Debug', [
                'sale_id' => $id,
                'item_payments_count' => count($itemPayments),
                'item_payments' => $itemPayments,
                'new_payment' => $newPayment,
                'validated_keys' => array_keys($validated),
            ]);

            if (!empty($itemPayments)) {
                // ชำระแยกรายสินค้า
                foreach ($itemPayments as $ip) {
                    $ipAmount = floatval($ip['amount'] ?? 0);
                    if ($ipAmount <= 0) continue;

                    $saleItem = AgrSaleItem::find($ip['sale_item_id']);
                    \Illuminate\Support\Facades\Log::info('Processing item payment', [
                        'sale_item_id' => $ip['sale_item_id'],
                        'amount' => $ipAmount,
                        'saleItem_found' => $saleItem ? true : false,
                        'saleItem_sale_id' => $saleItem ? $saleItem->sale_id : null,
                        'expected_sale_id' => $sale->id,
                        'match' => $saleItem ? ($saleItem->sale_id == $sale->id) : false,
                    ]);
                    if (!$saleItem || intval($saleItem->sale_id) != intval($sale->id)) continue;

                    AgrPayment::create([
                        'sale_id' => $id,
                        'sale_item_id' => $saleItem->id,
                        'paid_at' => now(),
                        'amount' => $ipAmount,
                        'new_payment' => $ipAmount,
                        'method' => $validated['method'] ?? null,
                        'note' => $validated['note'] ?? 'ชำระรายสินค้า',
                        'payment_slip' => $slipPath,
                    ]);

                    // อัพเดท paid_amount ของ item
                    $saleItem->paid_amount = floatval($saleItem->paid_amount) + $ipAmount;
                    $saleItem->recalcPaymentStatus();
                    \Illuminate\Support\Facades\Log::info('Payment created for item', [
                        'saleItem_id' => $saleItem->id,
                        'new_paid_amount' => $saleItem->paid_amount,
                    ]);
                }
            } elseif ($newPayment > 0) {
                // ชำระแบบเดิม (รวมทั้งบิล) → กระจายตามสัดส่วน
                $saleItems = AgrSaleItem::where('sale_id', $id)->get();
                $itemsTotalForDist = $saleItems->sum('line_total');
                $remainingPayment = $newPayment;

                foreach ($saleItems as $idx => $saleItem) {
                    if ($itemsTotalForDist > 0) {
                        $proportion = $saleItem->line_total / $itemsTotalForDist;
                        $itemPay = ($idx === $saleItems->count() - 1)
                            ? $remainingPayment
                            : round($newPayment * $proportion, 2);
                        $itemPay = min($itemPay, $remainingPayment);
                    } else {
                        $itemPay = 0;
                    }

                    if ($itemPay > 0) {
                        AgrPayment::create([
                            'sale_id' => $id,
                            'sale_item_id' => $saleItem->id,
                            'paid_at' => now(),
                            'amount' => $itemPay,
                            'new_payment' => $itemPay,
                            'method' => $validated['method'] ?? null,
                            'note' => $validated['note'] ?? 'ชำระจากการอัพเดท',
                            'payment_slip' => $slipPath,
                        ]);

                        $saleItem->paid_amount = floatval($saleItem->paid_amount) + $itemPay;
                        $saleItem->recalcPaymentStatus();
                        $remainingPayment -= $itemPay;
                    }
                }
            }

            // ✅ คำนวณยอดชำระรวมใหม่จากตาราง payments (หลังจากเพิ่มรายการใหม่)
            $totalPaid = AgrPayment::where('sale_id', $id)->sum('amount');

            // ✅ คำนวณ payment_status อัตโนมัติตามยอดชำระ
            $paymentStatusUpdate = 'pending';
            $paidAmountUpdate = 0;
            $depositUpdate = $totalAmount;

            if ($totalPaid >= $totalAmount && $totalAmount > 0) {
                $paymentStatusUpdate = 'completed';
                $paidAmountUpdate = $totalAmount;
                $depositUpdate = 0;
            } elseif ($totalPaid > 0) {
                $paymentStatusUpdate = 'partial';
                $paidAmountUpdate = $totalPaid;
                $depositUpdate = $totalAmount - $totalPaid;
            }

            $depositPercentUpdate = $totalAmount > 0 ? ($depositUpdate / $totalAmount) * 100 : 0;

            // อัพเดทสต็อกสินค้า
            foreach ($stockAdjustments as $pid => $adj) {
                if (isset($productsModels[$pid])) {
                    $product = $productsModels[$pid];
                    $product->stock = $product->stock + $adj['old'] - $adj['new'];
                    $product->save();
                }
            }

            // อัพเดทรายการขายหลัก
            $saleDataUpdate = array_merge($validated, [
                'product_id' => $firstItem['product_id'],
                'custom_product_id' => $firstItem['custom_product_id'] ?? null,
                'quantity' => $firstItem['quantity'],
                'price' => $firstItem['price'],
                'invoice_no' => $newInvoiceNo,
                'shipping_cost' => $shippingCost,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmountUpdate,
                'deposit' => $depositUpdate,
                'deposit_percent' => $depositPercentUpdate,
                'payment_status' => $paymentStatusUpdate,
                'store_id' => $storeId,
            ]);
            unset($saleDataUpdate['items']);
            unset($saleDataUpdate['item_payments']);
            $sale->update($saleDataUpdate);

            // สร้างรายการใหม่ตามที่ส่งมา (เก็บ paid_amount เดิมไว้)
            $oldItemPayments = [];
            $existingItems = AgrSaleItem::where('sale_id', $sale->id)->get();
            foreach ($existingItems as $ei) {
                $oldItemPayments[$ei->product_id] = [
                    'paid_amount' => $ei->paid_amount,
                    'payment_status' => $ei->payment_status,
                ];
            }

            // ล้างรายการสินค้าเดิมของบิลนี้ทั้งหมด
            AgrSaleItem::where('sale_id', $sale->id)->delete();

            foreach ($items as $item) {
                $lineTotal = $item['quantity'] * $item['price'];
                $prevPaid = $oldItemPayments[$item['product_id']]['paid_amount'] ?? 0;
                $newItem = AgrSaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'custom_product_id' => $item['custom_product_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'line_total' => $lineTotal,
                    'paid_amount' => $prevPaid,
                    'payment_status' => 'pending',
                ]);
                $newItem->recalcPaymentStatus();

                // อัพเดท payment records ให้ชี้ไปที่ item ใหม่
                AgrPayment::where('sale_id', $sale->id)
                    ->whereIn('sale_item_id', $existingItems->where('product_id', $item['product_id'])->pluck('id'))
                    ->update(['sale_item_id' => $newItem->id]);
            }

            // [Consolidation logic] ถ้าข้อมูลเดิมมีพี่น้อง (Split records) ให้ลบทิ้งทั้งหมด
            // เพื่อรวบยอดมาไว้ที่เรคคอร์ดนี้เพียงอันเดียวตาม 1:1 model
            AgrSale::where('invoice_no', $newInvoiceNo)
                ->where('id', '!=', $sale->id)
                ->each(function($sibling) {
                    AgrPayment::where('sale_id', $sibling->id)->delete();
                    AgrSaleItem::where('sale_id', $sibling->id)->delete();
                    $sibling->delete();
                });

            DB::commit();
            return redirect()->back()->with('success', 'ปรับปรุงข้อมูลการขายเรียบร้อยแล้ว');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            if(DB::transactionLevel() > 0) DB::rollBack();
            return redirect()->back()->with('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $sale = AgrSale::findOrFail($id);
            
            // คืนค่าสต็อกก่อนลบ
            $saleItems = AgrSaleItem::where('sale_id', $id)->get();
            if($saleItems->isNotEmpty()) {
                foreach ($saleItems as $item) {
                    $product = AgrProduct::find($item->product_id);
                    if ($product) {
                        $product->stock += $item->quantity;
                        $product->save();
                    }
                }
            } else if ($sale->product_id) { // Backward compatibility
                $product = AgrProduct::find($sale->product_id);
                if ($product) {
                    $product->stock += $sale->quantity;
                    $product->save();
                }
            }
    
            AgrPayment::where('sale_id', $id)->delete();
            AgrSaleItem::where('sale_id', $id)->delete();
            $sale->delete();
            
            DB::commit();
            return redirect()->back()->with('success', 'ลบรายการและคืนสต็อกเรียบร้อยแล้ว');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'เกิดข้อผิดพลาดในการลบ: ' . $e->getMessage());
        }
    }


    public function show()
    {
        return Inertia::render('AGR/Sales/SalesReport');
    }
}
