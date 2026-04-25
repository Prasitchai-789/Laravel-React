<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\ProductionApiController;
use App\Http\Controllers\Api\ComputerApiController;

Route::prefix('api')->middleware(['auth'])->group(function () {
    // Dashboard API
    Route::get('/dashboard/summary', [DashboardApiController::class, 'summary'])->name('api.dashboard.summary');

    // Production API
    Route::get('/production/chart', [ProductionApiController::class, 'chart'])->name('api.production.chart');

    // Computers API
    Route::get('/computers/check-plan', [ComputerApiController::class, 'checkPlan'])->name('api.computers.check-plan');

    // Executive Dashboard API
    Route::get('/executive/production-report', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getProductionReport'])->name('api.executive.production.report');
    Route::get('/executive/soplan-report', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getSOPlan'])->name('api.executive.soplan.report');
    Route::get('/executive/production-summary', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getProductionSummary'])->name('api.executive.production.summary');
    Route::get('/executive/cpo-summary', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getCPOSummary'])->name('api.executive.cpo.summary');
    Route::get('/executive/purchase-summary', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getPurchaseSummary'])->name('api.executive.purchase.summary');

    // Purchase & PO Invoice API
    Route::get('/purchase/poinv-dashboard', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvDashboard'])->name('api.purchase.poinv.dashboard');
    Route::get('/purchase/summary', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPurchaseSummary'])->name('api.purchase.summary');
    Route::get('/purchase/detailed-report', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getDetailedReport'])->name('api.purchase.detailed.report');
    Route::get('/purchase/poinv-summary', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvSummary'])->name('api.purchase.poinv.summary');
    Route::get('/purchase/poinv-monthly', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvMonthly'])->name('api.purchase.poinv.monthly');
    Route::get('/purchase/order-forecast', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getForecast'])->name('api.purchase.order.forecast');
    Route::get('/purchase/po-list', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOList'])->name('api.purchase.po.list');
    Route::get('/purchase/poinv-chart', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvChart'])->name('api.purchase.poinv.chart');

    // Sales API
    Route::get('/sales/summary-card', [\App\Http\Controllers\Api\SalesApiController::class, 'getSummaryCard'])->name('api.sales.summary.card');
    Route::get('/sales/detailed-summary', [\App\Http\Controllers\Api\SalesApiController::class, 'getDetailedSummary'])->name('api.sales.detailed.summary');
    Route::get('/sales/top-customers', [\App\Http\Controllers\Api\SalesApiController::class, 'getTopCustomers'])->name('api.sales.top.customers');

    // Financial & Accounting API
    Route::get('/financial/accounts', [\App\Http\Controllers\Api\FinancialApiController::class, 'getAccountBalances'])->name('api.financial.accounts');
});

// Backward Compatibility Aliases (to be removed after full migration)
Route::middleware(['auth', 'permission:developer.view|gm.view'])->group(function () {
    Route::get('/api/purchase/executive-production-report', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getProductionReport']);
    Route::get('/api/purchase/executive-soplan-report', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getSOPlan']);
    Route::get('/palm/cpo/summary-card/api', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getCPOSummary']);
    Route::get('/purchase/summary-card/api', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getPurchaseSummary']);
    Route::get('/palm/production/summary-card/api', [\App\Http\Controllers\Api\ExecutiveApiController::class, 'getProductionSummary']);

    // New purchase aliases
    Route::get('/purchase/po-invoice-dashboard/api', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvDashboard']);
    Route::get('/purchase/order-forecast/api', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getForecast']);
    Route::get('/purchase/po/api', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOList']);
    Route::get('/purchase/po/chart', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvChart']);
    Route::get('/poinv-win-summary/api', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvSummary']);
    Route::get('/poinv-win-monthly/api', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPOInvMonthly']);
    Route::get('/purchase/dashboard/api', [\App\Http\Controllers\Api\PurchaseApiController::class, 'getPurchaseSummary']);

    // Sales aliases
    Route::get('/sales/summary-card/api', [\App\Http\Controllers\Api\SalesApiController::class, 'getSummaryCard']);
    Route::get('/sales-mar/api', [\App\Http\Controllers\Api\SalesApiController::class, 'getDetailedSummary']);
    Route::get('/sales-mar-win/api', [\App\Http\Controllers\Api\SalesApiController::class, 'getDetailedSummary']);

    // Financial aliases
    Route::get('/accounts/api', [\App\Http\Controllers\Api\FinancialApiController::class, 'getAccountBalances']);
});
