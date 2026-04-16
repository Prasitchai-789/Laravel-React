<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\OrderForecastService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderForecastController extends Controller
{
    protected $orderForecastService;

    public function __construct(OrderForecastService $orderForecastService)
    {
        $this->orderForecastService = $orderForecastService;
    }

    /**
     * Render the visual dashboard page
     */
    public function index()
    {
        return Inertia::render('Dashboard/Purchase/OrderForecast');
    }

    /**
     * API endpoint to get data
     */
    public function getData()
    {
        try {
            $data = $this->orderForecastService->getForecastData();
            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
