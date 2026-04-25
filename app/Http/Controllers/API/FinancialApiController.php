<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Dashboard\FinancialService;

class FinancialApiController extends BaseApiController
{
    protected $service;

    public function __construct(FinancialService $service)
    {
        $this->service = $service;
    }

    public function getAccountBalances(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', date('Y-01-01'));
        $endDate = $request->query('end_date', date('Y-m-d'));
        $accountCodes = $request->input('account_codes', ['411001', '412001', '422001', '513001']);

        try {
            $data = $this->service->getAccountBalances($startDate, $endDate, $accountCodes);
            return $this->successResponse($data, 'Account balances retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
