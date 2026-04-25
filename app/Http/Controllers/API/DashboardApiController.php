<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardApiController extends BaseApiController
{
    public function __construct(private DashboardService $dashboardService)
    {
    }

    public function summary(Request $request): JsonResponse
    {
        // Require authorization if needed
        // $this->authorize('view-dashboard');

        $filters = $request->only(['start_date', 'end_date', 'keyword', 'status']);
        
        try {
            $data = $this->dashboardService->getSummary($filters);
            return $this->successResponse($data, 'Dashboard summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
