<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Services\Dashboard\ExecutiveProductionService;
use Illuminate\Http\JsonResponse;

class ExecutiveApiController extends BaseApiController
{
    public function __construct(private ExecutiveProductionService $service)
    {
    }

    public function getProductionReport(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
 
        try {
            $data = $this->service->getProductionReportData($startDate, $endDate);
            return $this->successResponse($data, 'Production report retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getSOPlan(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
 
        try {
            $data = $this->service->getSOPlanData($startDate, $endDate);
            return $this->successResponse($data, 'SO plan report retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getProductionSummary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        try {
            $data = $this->service->getProductionSummaryCard($startDate, $endDate);
            return $this->successResponse($data, 'Production summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getCPOSummary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        try {
            $data = $this->service->getCPOSummary($startDate, $endDate);
            return $this->successResponse($data, 'CPO summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getPurchaseSummary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $goodId = $request->query('good_id', 2156);

        try {
            $data = $this->service->getPurchaseSummaryCard($startDate, $endDate, $goodId);
            return $this->successResponse($data, 'Purchase summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
