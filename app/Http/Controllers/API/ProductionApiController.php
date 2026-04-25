<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Services\ProductionService;
use Illuminate\Http\JsonResponse;

class ProductionApiController extends BaseApiController
{
    public function __construct(private ProductionService $productionService)
    {
    }

    public function chart(Request $request): JsonResponse
    {
        $filters = $request->only(['start_date', 'end_date', 'keyword', 'status']);
        
        try {
            $data = $this->productionService->getChartData($filters);
            return $this->successResponse($data, 'Production chart data retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
