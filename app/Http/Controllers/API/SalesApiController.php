<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Dashboard\SalesService;
use Carbon\Carbon;

class SalesApiController extends BaseApiController
{
    protected $service;

    public function __construct(SalesService $service)
    {
        $this->service = $service;
    }

    /**
     * Get Sales Summary Card Data
     */
    public function getSummaryCard(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->query('end_date', Carbon::today()->format('Y-m-d'));
        $goodId = $request->query('good_id');

        if (!$goodId) {
            return $this->errorResponse('good_id is required', 400);
        }

        try {
            $data = $this->service->getSalesSummaryCard($startDate, $endDate, $goodId);
            return $this->successResponse($data, 'Sales summary card retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get Detailed Sales Summary
     */
    public function getDetailedSummary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', date('Y-01-01'));
        $endDate = $request->query('end_date', date('Y-m-d'));
        $goodId = $request->query('good_id');

        try {
            $data = $this->service->getSalesSummary($startDate, $endDate, $goodId);
            return $this->successResponse($data, 'Sales detailed summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get Top Customers
     */
    public function getTopCustomers(Request $request): JsonResponse
    {
        $limit = $request->query('limit', 5);

        try {
            $data = $this->service->getTopCustomers($limit);
            return $this->successResponse($data, 'Top customers retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
