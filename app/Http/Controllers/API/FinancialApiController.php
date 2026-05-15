<?php

namespace App\Http\Controllers\Api;

use App\Models\FinancialAccountCategory;
use App\Models\WIN\EMAcc;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;
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
        $accountCodes = $request->input('account_codes');

        if (empty($accountCodes)) {
            $accountCodes = ['411001', '412001', '422001', '422003', '422004', '513001'];

            if (Schema::hasTable('financial_account_categories')) {
                $accountCodes = FinancialAccountCategory::query()
                    ->where('is_active', true)
                    ->pluck('acc_code')
                    ->merge(['411001', '412001', '422001', '422003', '422004'])
                    ->unique()
                    ->values()
                    ->all();
            }
        }

        try {
            $data = $this->service->getAccountBalances($startDate, $endDate, $accountCodes);
            return $this->successResponse($data, 'Account balances retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function accountCategories(): JsonResponse
    {
        try {
            $categories = FinancialAccountCategory::query()
                ->orderBy('sort_order')
                ->orderBy('acc_code')
                ->get();

            $names = EMAcc::query()
                ->select('AccCode', 'AccName')
                ->whereIn('AccCode', $categories->pluck('acc_code')->all())
                ->get()
                ->keyBy('AccCode');

            $data = $categories->map(function (FinancialAccountCategory $category) use ($names) {
                $accName = $names->get($category->acc_code)?->AccName ?? $category->acc_name;

                return [
                    'id' => $category->id,
                    'acc_code' => $category->acc_code,
                    'acc_name' => $accName,
                    'category' => $category->category,
                    'type' => $category->type,
                    'is_active' => $category->is_active,
                    'sort_order' => $category->sort_order,
                ];
            });

            return $this->successResponse($data, 'Financial account categories retrieved successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function saveAccountCategories(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categories' => ['required', 'array'],
            'categories.*.acc_code' => ['required', 'string', 'max:50'],
            'categories.*.acc_name' => ['nullable', 'string', 'max:255'],
            'categories.*.category' => ['required', 'string', 'max:255'],
            'categories.*.type' => ['required', 'in:expense,other'],
            'categories.*.is_active' => ['boolean'],
            'categories.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            $codes = collect($validated['categories'])
                ->pluck('acc_code')
                ->map(fn ($code) => trim((string) $code))
                ->filter()
                ->unique()
                ->values();

            $names = EMAcc::query()
                ->select('AccCode', 'AccName')
                ->whereIn('AccCode', $codes->all())
                ->get()
                ->keyBy('AccCode');

            foreach ($validated['categories'] as $index => $row) {
                $accCode = trim((string) $row['acc_code']);
                $accName = $names->get($accCode)?->AccName ?? ($row['acc_name'] ?? null);

                FinancialAccountCategory::updateOrCreate(
                    ['acc_code' => $accCode],
                    [
                        'acc_name' => $accName,
                        'category' => trim((string) $row['category']),
                        'type' => $row['type'],
                        'is_active' => (bool) ($row['is_active'] ?? true),
                        'sort_order' => $row['sort_order'] ?? ($index + 1),
                    ]
                );
            }

            return $this->accountCategories();
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
