<?php

namespace App\Http\Controllers\AGR;

use Inertia\Inertia;
use App\Models\WIN\WebCity;
use Illuminate\Http\Request;
use App\Models\AGR\AgrCustomer;
use App\Http\Controllers\Controller;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $cities = WebCity::all();
        // $customers = AgrCustomer::all();
        $customers = AgrCustomer::with(['cityProvince', 'cityDistrict', 'citySubdistrict'])->get();

        return Inertia::render('AGR/Customers/Index', [
            'customers' => $customers,
            'cities' => $cities
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'id_card' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'subdistrict' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        AgrCustomer::create($validated);

        return redirect()->route('customers.index');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'id_card' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'subdistrict' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);
        $customer = AgrCustomer::findOrFail($id);
        $customer->update($validated);

        return redirect()->route('customers.index');
    }

    public function destroy($id)
    {
        AgrCustomer::destroy($id);
        return redirect()->route('customers.index');
    }
}
