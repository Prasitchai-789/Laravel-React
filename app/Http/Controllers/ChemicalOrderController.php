<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ChemicalOrder;
use App\Models\ChemicalOrderItem;
use App\Models\Chemical;

class ChemicalOrderController extends Controller
{
    // แสดงรายการ Order / Lot
    public function index()
    {
        $orders = ChemicalOrder::with('items.chemical')->paginate(10);
        $chemicals = Chemical::all(); // ดึงสารเคมีทั้งหมด

        return Inertia::render('ChemicalOrder/Index', [
            'orders' => $orders,
            'pagination' => $orders,
            'chemicals' => $chemicals, // ส่งเข้า props
        ]);
    }


    // แสดงฟอร์มสร้าง Order ใหม่
    public function create()
    {
        $chemicals = Chemical::all();
        return Inertia::render('ChemicalOrder/Create', compact('chemicals'));
    }

    // บันทึก Order ใหม่
    public function store(Request $request)
    {
        $request->validate([
            'lot_number' => 'required|unique:chemical_orders,lot_number',
            'order_date' => 'required|date',
            'items.*.chemical_id' => 'required|exists:chemicals,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $order = ChemicalOrder::create([
            'lot_number' => $request->lot_number,
            'order_date' => $request->order_date,
            'status' => 'Pending',
            'created_by' => auth()->id(),
        ]);

        foreach ($request->items as $item) {
            ChemicalOrderItem::create([
                'order_id' => $order->id,
                'chemical_id' => $item['chemical_id'],
                'quantity' => $item['quantity'],
                'remaining_quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['quantity'] * $item['unit_price'],
                'expiry_date' => $item['expiry_date'] ?? null,
            ]);
        }

        return redirect()->route('orders.index')->with('success', 'Order created successfully!');
    }

    // แสดงฟอร์มแก้ไข Order
    public function edit(ChemicalOrder $order)
    {
        $chemicals = Chemical::all();
        $order->load('items.chemical');

        return Inertia::render('ChemicalOrder/Edit', compact('order', 'chemicals'));
    }

    // อัปเดต Order
    public function update(Request $request, ChemicalOrder $order)
    {
        $request->validate([
            'lot_number' => 'required|unique:chemical_orders,lot_number,' . $order->id,
            'order_date' => 'required|date',
            'items.*.chemical_id' => 'required|exists:chemicals,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $order->update([
            'lot_number' => $request->lot_number,
            'order_date' => $request->order_date,
            'status' => $request->status ?? $order->status,
        ]);

        // ลบ item เก่าออกก่อน
        $order->items()->delete();

        // เพิ่ม item ใหม่
        foreach ($request->items as $item) {
            ChemicalOrderItem::create([
                'order_id' => $order->id,
                'chemical_id' => $item['chemical_id'],
                'quantity' => $item['quantity'],
                'remaining_quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['quantity'] * $item['unit_price'],
                'expiry_date' => $item['expiry_date'] ?? null,
            ]);
        }

        return redirect()->route('orders.index')->with('success', 'Order updated successfully!');
    }

    // ลบ Order
    public function destroy(ChemicalOrder $order)
    {
        $order->items()->delete(); // ลบ item ก่อน
        $order->delete();

        return redirect()->route('orders.index')->with('success', 'Order deleted successfully!');
    }
}
