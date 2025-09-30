<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\AGR\AgrProduct;
use App\Models\AGR\LocationStore;
use App\Http\Controllers\Controller;
use App\Models\AGR\AgrStockTransaction;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function create()
    {
        $locations = LocationStore::select('id as value', 'location_name as label')->get();

        return Inertia::render('AGR/Stocks/Index', [
            'mode' => 'create',
            'locations' => $locations,
        ]);
    }
    public function store(Request $request)
    {
        // dd($request);

        $validated = $request->validate([
            'sku'       => 'nullable|string|max:255',
            'name'      => 'required|string|max:255',
            'category'  => 'nullable|string|max:255',
            'price'     => 'required|numeric|min:0',
            'stock'     => 'nullable|integer|min:0',
            'notes'     => 'nullable|string',
            'store_id'     => 'nullable|numeric|max:255',
        ]);

        $product = AgrProduct::create($validated);

        return redirect()->back()->with('success', 'created successfully');
    }
    public function storeLocation(Request $request)
    {
        $validated = $request->validate([
            'location_name' => 'nullable',
            'note' => 'nullable',
        ]);

        $location = LocationStore::create($validated);

        return redirect()->back()->with('success', 'created successfully');
    }
    public function updateStock(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'stock' => 'required|integer|min:0',
                'transactionType' => 'required|in:in,out',
            ]);

            $product = AgrProduct::findOrFail($id);

            if ($validated['transactionType'] === 'in') {
                $product->stock += $validated['stock'];
            } else {
                $product->stock -= $validated['stock'];

                if ($product->stock < 0) {
                    throw ValidationException::withMessages([
                        'stock' => 'จำนวนสินค้าคงเหลือไม่พอสำหรับการจ่ายออก',
                    ]);
                }
            }

            $product->notes = $request->notes ?? $product->notes;
            $product->save();

            AgrStockTransaction::create([
                'product_id' => $product->id,
                'transaction_type' => $validated['transactionType'],
                'quantity' => $validated['stock'],
                'notes' => $request->notes ?? null,
                'balance_after' => $product->stock,
                'user_id' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'อัปเดตสินค้าเรียบร้อยแล้ว');
        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => $e->getMessage(),
            ]);
        }
    }

    public function updateProduct(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'sku'       => 'nullable|string|max:255',
                'name'      => 'required|string|max:255',
                'price'     => 'required|numeric|min:0',
                'stock'     => 'nullable|integer|min:0',
                'notes'     => 'nullable|string',
                'store_id'     => 'nullable|numeric|max:255',
            ]);

            $product = AgrProduct::findOrFail($id);
            $product->update($validated);

            return redirect()->back()->with('success', 'อัปเดตสินค้าเรียบร้อยแล้ว');

        } catch (\Exception $e) {
            return back()->withErrors([
                'general' => $e->getMessage(),
            ]);
        }
    }


    public function destroy($id)
    {
        AgrProduct::destroy($id);
        return redirect()->back()->with('success', 'deleted successfully');
    }
}
