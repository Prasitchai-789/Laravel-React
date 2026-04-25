<?php

use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\ComputerApiController;
use App\Http\Controllers\Api\ExecutiveApiController;
use App\Http\Controllers\Api\FinancialApiController;
use App\Http\Controllers\Api\ProductionApiController;
use App\Http\Controllers\Api\PurchaseApiController;
use App\Http\Controllers\Api\SalesApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::prefix('api')->group(function () {
        Route::prefix('dashboard')->name('api.dashboard.')->group(function () {
            Route::get('summary', [DashboardApiController::class, 'summary'])->name('summary');
        });

        Route::prefix('production')->name('api.production.')->group(function () {
            Route::get('chart', [ProductionApiController::class, 'chart'])->name('chart');
        });

        Route::prefix('computers')->name('api.computers.')->group(function () {
            Route::get('check-plan', [ComputerApiController::class, 'checkPlan'])->name('check-plan');
        });

        Route::middleware(['permission:developer.view|gm.view'])->group(function () {
            Route::prefix('executive')->name('api.executive.')->group(function () {
                Route::get('production-report', [ExecutiveApiController::class, 'getProductionReport'])->name('production.report');
                Route::get('soplan-report', [ExecutiveApiController::class, 'getSOPlan'])->name('soplan.report');
                Route::get('production-summary', [ExecutiveApiController::class, 'getProductionSummary'])->name('production.summary');
                Route::get('cpo-summary', [ExecutiveApiController::class, 'getCPOSummary'])->name('cpo.summary');
                Route::get('purchase-summary', [ExecutiveApiController::class, 'getPurchaseSummary'])->name('purchase.summary');
            });

            Route::prefix('purchase')->name('api.purchase.')->group(function () {
                Route::get('poinv-dashboard', [PurchaseApiController::class, 'getPOInvDashboard'])->name('poinv.dashboard');
                Route::get('summary', [PurchaseApiController::class, 'getPurchaseSummary'])->name('summary');
                Route::get('detailed-report', [PurchaseApiController::class, 'getDetailedReport'])->name('detailed.report');
                Route::get('poinv-summary', [PurchaseApiController::class, 'getPOInvSummary'])->name('poinv.summary');
                Route::get('poinv-monthly', [PurchaseApiController::class, 'getPOInvMonthly'])->name('poinv.monthly');
                Route::get('order-forecast', [PurchaseApiController::class, 'getForecast'])->name('order.forecast');
                Route::get('po-list', [PurchaseApiController::class, 'getPOList'])->name('po.list');
                Route::get('poinv-chart', [PurchaseApiController::class, 'getPOInvChart'])->name('poinv.chart');
            });

            Route::prefix('sales')->name('api.sales.')->group(function () {
                Route::get('summary-card', [SalesApiController::class, 'getSummaryCard'])->name('summary.card');
                Route::get('detailed-summary', [SalesApiController::class, 'getDetailedSummary'])->name('detailed.summary');
                Route::get('top-customers', [SalesApiController::class, 'getTopCustomers'])->name('top.customers');
            });

            Route::prefix('financial')->name('api.financial.')->group(function () {
                Route::get('accounts', [FinancialApiController::class, 'getAccountBalances'])->name('accounts');
            });
        });
    });

    // Backward Compatibility Aliases (to be removed after full migration)
    Route::middleware(['permission:developer.view|gm.view'])->group(function () {
        Route::get('/api/purchase/executive-production-report', [ExecutiveApiController::class, 'getProductionReport']);
        Route::get('/api/purchase/executive-soplan-report', [ExecutiveApiController::class, 'getSOPlan']);
        Route::get('/palm/cpo/summary-card/api', [ExecutiveApiController::class, 'getCPOSummary']);
        Route::get('/purchase/summary-card/api', [ExecutiveApiController::class, 'getPurchaseSummary']);
        Route::get('/palm/production/summary-card/api', [ExecutiveApiController::class, 'getProductionSummary']);

        Route::get('/purchase/po-invoice-dashboard/api', [PurchaseApiController::class, 'getPOInvDashboard']);
        Route::get('/purchase/order-forecast/api', [PurchaseApiController::class, 'getForecast']);
        Route::get('/purchase/po/api', [PurchaseApiController::class, 'getPOList']);
        Route::get('/purchase/po/chart', [PurchaseApiController::class, 'getPOInvChart']);
        Route::get('/poinv-win-summary/api', [PurchaseApiController::class, 'getPOInvSummary']);
        Route::get('/poinv-win-monthly/api', [PurchaseApiController::class, 'getPOInvMonthly']);
        Route::get('/purchase/dashboard/api', [PurchaseApiController::class, 'getPurchaseSummary']);

        Route::get('/sales/summary-card/api', [SalesApiController::class, 'getSummaryCard']);
        Route::get('/sales-mar/api', [SalesApiController::class, 'getDetailedSummary']);
        Route::get('/sales-mar-win/api', [SalesApiController::class, 'getDetailedSummary']);

        Route::get('/accounts/api', [FinancialApiController::class, 'getAccountBalances']);
    });
});
