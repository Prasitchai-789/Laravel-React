<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Services\ComputerService;
use Illuminate\Http\JsonResponse;

class ComputerApiController extends BaseApiController
{
    public function __construct(private ComputerService $computerService)
    {
    }

    public function checkPlan(Request $request): JsonResponse
    {
        $filters = $request->only(['start_date', 'end_date', 'keyword', 'status']);
        
        try {
            $data = $this->computerService->getCheckPlan($filters);
            return $this->successResponse($data, 'Computer check plan retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
