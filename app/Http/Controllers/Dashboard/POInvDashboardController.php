<?php

namespace App\Http\Controllers\Dashboard;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Dashboard\POInvDashboardService;
use Inertia\Inertia;
use Carbon\Carbon;

class POInvDashboardController extends Controller
{
    protected $service;

    public function __construct(POInvDashboardService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        return Inertia::render('Dashboard/Purchase/POInvDashboard');
    }

    public function apiData(Request $request)
    {
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));
        
        try {
            $data = $this->service->getDashboardData($date);
            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
