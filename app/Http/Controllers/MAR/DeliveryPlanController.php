<?php

namespace App\Http\Controllers\MAR;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Http\Controllers\Controller;
use App\Models\MAR\Order;
use App\Models\MAR\DeliveryPlanItem;
use App\Models\MAR\DeliveryPlanReference;

class DeliveryPlanController extends Controller
{
    /**
     * Fetch all global references (e.g., KN Price)
     * GET /api/delivery-plan/references
     */
    public function getReferences()
    {
        $refs = DeliveryPlanReference::all()->pluck('ref_value', 'ref_key');
        return response()->json([
            'success'   => true,
            'references' => $refs
        ]);
    }

    /**
     * Update a global reference
     * POST /api/delivery-plan/reference
     */
    public function updateReference(Request $request)
    {
        $validated = $request->validate([
            'key'   => 'required|string',
            'value' => 'nullable|string',
        ]);

        DeliveryPlanReference::updateOrCreate(
            ['ref_key' => $validated['key']],
            ['ref_value' => $validated['value']]
        );

        return response()->json([
            'success' => true,
            'message' => 'Reference updated successfully'
        ]);
    }

    /**
     * Render the Delivery Plan Page
     */
    public function page()
    {
        return Inertia::render('MAR/DeliveryPlanPage');
    }

    /**
     * Fetch orders and next 3 days plan
     * GET /api/delivery-plan/{date}
     */
    public function index($date)
    {
        $startDate = Carbon::parse($date)->startOfDay();
        
        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $dates[] = $startDate->copy()->addDays($i)->format('Y-m-d');
        }

        // Fetch orders and their delivery plan items for the NEXT 7 days
        // total_planned: Sum of ALL plans (for scheduling)
        // total_delivered: Sum of past/today plans (for progress tracking)
        $orders = Order::withSum('deliveryPlanItems as total_planned', 'quantity')
            ->withSum(['deliveryPlanItems as total_delivered' => function($query) {
                $query->whereDate('plan_date', '<', now()->toDateString());
            }], 'quantity')
            ->with(['deliveryPlanItems' => function($query) use ($dates) {
                $query->whereIn('plan_date', $dates);
            }])
            ->where(function($query) {
                $query->where('is_completed', 0)->orWhereNull('is_completed');
            })
            ->get();

        // Optional: you can structure this logic so that "remaining" is calculated strictly on frontend
        // based on total quantity vs all plan items historically, or we can fetch sum from DB.
        // As per the request, we will pass the orders directly to frontend.
        return response()->json([
            'dates'  => $dates,
            'orders' => $orders
        ]);
    }

    /**
     * Update or create a delivery plan cell.
     * POST /api/delivery-plan/update
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|integer',
            'date'     => 'required|date',
            'quantity' => 'nullable|numeric',
        ]);

        $quantity = (float) ($validated['quantity'] ?? 0);

        if ($quantity <= 0) {
            // Delete if quantity is empty or 0 to save space
            DeliveryPlanItem::where('order_id', $validated['order_id'])
                ->whereDate('plan_date', $validated['date'])
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Plan item removed'
            ]);
        }

        DeliveryPlanItem::updateOrCreate(
            [
                'order_id'  => $validated['order_id'],
                'plan_date' => $validated['date'],
            ],
            [
                'quantity'  => $quantity,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Plan updated successfully'
        ]);
    }

    /**
     * Create a new Order
     * POST /api/delivery-plan/order
     */
    public function storeOrder(Request $request)
    {
        $validated = $request->validate([
            'cust_id'        => 'nullable|integer',
            'cust_code'      => 'nullable|string|max:255',
            'customer_name'  => 'required|string|max:255',
            'dest_cust_id'   => 'nullable|integer',
            'dest_cust_code' => 'nullable|string|max:255',
            'dest_cust_name' => 'nullable|string|max:255',
            'good_id'        => 'nullable|integer',
            'good_code'      => 'nullable|string|max:255',
            'product'        => 'required|string|max:255',
            'quantity'       => 'required|numeric',
            'price_sell'     => 'required|numeric',
            'price_customer' => 'required|numeric',
        ]);

        $order = Order::create($validated);
        // eager load the empty relationship to prevent missing key errors on frontend
        $order->load('deliveryPlanItems');

        return response()->json([
            'success' => true,
            'order'   => $order,
        ]);
    }

    /**
     * Mark Order as Completed
     * POST /api/delivery-plan/order/complete
     */
    public function completeOrder(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:sqlsrv.orders,id',
        ]);

        $order = Order::find($validated['order_id']);
        $order->is_completed = true;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order marked as completed',
        ]);
    }

    /**
     * Fetch Dropdown Lookups from EMCust and EMGood
     * GET /api/delivery-plan/lookups
     */
    public function lookups()
    {
        $customers = \Illuminate\Support\Facades\DB::connection('sqlsrv2')
            ->select('SELECT CustID, CustCode, CustName FROM EMCust ORDER BY CustName ASC');

        $goods = \Illuminate\Support\Facades\DB::connection('sqlsrv2')
            ->select('SELECT GoodID, GoodCode, GoodName1 FROM EMGood WHERE GoodID IN (2147, 2150, 2151, 2152, 9012)');

        return response()->json([
            'customers' => $customers,
            'goods' => $goods
        ]);
    }
}
