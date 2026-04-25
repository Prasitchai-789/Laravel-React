<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Dashboard\PurchaseService;
use Carbon\Carbon;

class PurchaseApiController extends BaseApiController
{
    protected $service;
    protected $forecastService;

    public function __construct(PurchaseService $service, \App\Services\Dashboard\OrderForecastService $forecastService)
    {
        $this->service = $service;
        $this->forecastService = $forecastService;
    }

    /**
     * Get PO Invoice Dashboard Data (FFB)
     */
    public function getPOInvDashboard(Request $request): JsonResponse
    {
        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        
        try {
            $data = $this->service->getPOInvDashboardData($date);
            return $this->successResponse($data, 'PO Invoice dashboard data retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get Purchase Summary by Department
     */
    public function getPurchaseSummary(Request $request): JsonResponse
    {
        $year = $request->query('year', date('Y'));
        $month = $request->query('month');
        $deptId = $request->query('dept_id');

        try {
            $data = $this->service->getPurchaseSummaryByDept($year, $month, $deptId);
            return $this->successResponse($data, 'Purchase summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get Detailed PO Invoice Report
     */
    public function getDetailedReport(Request $request): JsonResponse
    {
        $year = $request->query('year', date('Y'));
        $month = $request->query('month');
        $branchId = $request->query('brchid', 0);

        try {
            $data = $this->service->getPOInvDetailedReport($year, $month, $branchId);
            return $this->successResponse($data, 'Detailed report retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get PO Invoice Summary (by GoodID)
     */
    public function getPOInvSummary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', date('Y-01-01'));
        $endDate = $request->query('end_date', date('Y-m-d'));
        $goodId = $request->query('good_id', 2156);

        try {
            $data = $this->service->getPOInvSummary($startDate, $endDate, $goodId);
            return $this->successResponse($data, 'POInv summary retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get PO Invoice Monthly Trend (by GoodID)
     */
    public function getPOInvMonthly(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', date('Y-01-01'));
        $endDate = $request->query('end_date', date('Y-m-d'));
        $goodId = $request->query('good_id', 2156);

        try {
            $data = $this->service->getPOInvMonthly($startDate, $endDate, $goodId);
            return $this->successResponse($data, 'POInv monthly trend retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get Order Forecast Data
     */
    public function getForecast(Request $request): JsonResponse
    {
        try {
            $data = $this->forecastService->getForecastData();
            return $this->successResponse($data, 'Order forecast data retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get PO List (Paginated)
     */
    public function getPOList(Request $request): JsonResponse
    {
        $deptId = $request->query('dept_id', '1006');
        $year = $request->query('year', date('Y'));
        $month = $request->query('month');
        $perPage = $request->query('per_page', 10);
        $page = $request->query('page', 1);

        try {
            $data = $this->service->getPOList($deptId, $year, $month, $perPage, $page);
            return $this->successResponse($data, 'PO list retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get PO Invoice Chart Data
     */
    public function getPOInvChart(Request $request): JsonResponse
    {
        $year = $request->query('year', date('Y'));
        $month = $request->query('month');
        $deptId = $request->query('dept_id');
        $branchId = $request->query('brchid');

        try {
            $data = $this->service->getPOInvChartData($year, $month, $deptId, $branchId);
            return $this->successResponse($data, 'POInv chart data retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
