<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Production\PalmAnalyticsService;
use Illuminate\Http\Request;

class PalmAnalyticsController extends Controller
{
    protected $palmAnalyticsService;

    public function __construct(PalmAnalyticsService $palmAnalyticsService)
    {
        $this->palmAnalyticsService = $palmAnalyticsService;
    }

    public function intake(Request $request)
    {
        try {
            $days = $request->query('days', 30);
            $data = $this->palmAnalyticsService->getIntakeAnalytics($days);

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
