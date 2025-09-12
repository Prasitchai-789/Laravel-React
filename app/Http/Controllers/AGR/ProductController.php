<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\AGR\AgrProduct;
use App\Models\AGR\LocationStore;
use App\Http\Controllers\Controller;

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
        $validated = $request->validate([
            'sku'       => 'nullable|string|max:255',
            'name'      => 'required|string|max:255',
            'category'  => 'nullable|string|max:255',
            'price'     => 'required|numeric|min:0',
            'stock'     => 'nullable|integer|min:0',
            'notes'     => 'nullable|string',
            'store_id'     => 'nullable|string|max:255',
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

    public function update(Request $request, $id)
    {
        $product = AgrProduct::find($id);
        $product->update($request->all());
        return redirect()->back()->with('success', 'updated successfully');
    }

    public function destroy($id)
    {
        AgrProduct::destroy($id);
        return redirect()->back()->with('success', 'deleted successfully');
    }
}
