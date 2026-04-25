<?php

use App\Http\Controllers\Dashboard\CostAnalysisController;
use App\Http\Controllers\Dashboard\DailyBarCharController;
use App\Http\Controllers\ACC\AccountController;
use App\Http\Controllers\Api\POInvController;
use App\Http\Controllers\Api\PurchaseDashboardController;
use App\Http\Controllers\Api\SaleMARController;
use App\Http\Controllers\Api\SOInvController;
use App\Http\Controllers\Dashboard\ExecutiveProductionController;
use App\Http\Controllers\Dashboard\OrderForecastController;
use App\Http\Controllers\Dashboard\PalmDashboardController;
use App\Http\Controllers\Dashboard\PalmProductionController;
use App\Http\Controllers\Dashboard\POInvDashboardController;
use App\Http\Controllers\Dashboard\ProductStockReportController;
use App\Http\Controllers\Dashboard\TableTotalPalmController;
use App\Http\Controllers\MAR\SalesController as MARSalesController;
use App\Http\Controllers\PUR\POController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'permission:developer.view|gm.view'])->group(function () {
    Route::get('/developer/components', function () {
        return Inertia::render('Developer/ComponentGallery');
    })->name('developer.components');

    Route::get('palm/table', [TableTotalPalmController::class, 'index'])->name('palm.table.index');
    Route::get('palm/daily', [DailyBarCharController::class, 'index'])->name('palm.daily.index');
    Route::get('palm/production', [PalmProductionController::class, 'index'])->name('palm.production.index');
    Route::get('palm/dashboard', [PalmDashboardController::class, 'index'])->name('palm.dashboard.index');

    Route::get('/purchase/po-invoice-dashboard', [POInvDashboardController::class, 'index'])->name('poinv.dashboard.index');

    Route::get('/purchase/order-forecast', [OrderForecastController::class, 'index'])->name('order.forecast.index');

    Route::get('sales/dashboard', [MARSalesController::class, 'index'])->name('sales.dashboard.index');
    Route::get('cost-analysis/dashboard', [CostAnalysisController::class, 'index'])->name('cost-analysis.dashboard.index');
});

Route::middleware(['auth', 'permission:developer.view|gm.view'])->group(function () {
    Route::get('purchase/po', [POController::class, 'index']);
    Route::get('/purchase/po/show/{id}', [POController::class, 'show'])->name('po.show');
    Route::get('/expense-by-dept', [POController::class, 'expenseByDept'])->name('expense-by-dept');
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts');
});

Route::middleware(['auth', 'permission:developer.view|gm.view'])->group(function () {
    Route::get('purchase/dashboard', [PurchaseDashboardController::class, 'index']);

    Route::get('/purchase/executive-report', function () {
        return Inertia::render('Dashboard/ExecutiveReport');
    })->name('executive.report');

    Route::get('/purchase/executive-production-report', function () {
        return Inertia::render('Dashboard/ExecutiveProductionReport');
    })->name('executive.production.report');

    Route::get('/stock/valuation-report', function () {
        return Inertia::render('Dashboard/Stock/ProductStockReport');
    })->name('stock.valuation.report');

    Route::get('/api/stock/valuation-summary', [ProductStockReportController::class, 'getProductStockSummary'])->name('api.stock.valuation.summary');

    Route::get('/market/palm-price-report', function () {
        return Inertia::render('Dashboard/Market/PalmPriceReport');
    })->name('market.palm-price-report');

    Route::get('/stock/cpo-supply-dashboard', function () {
        return Inertia::render('Dashboard/Stock/CpoSupplyDashboard');
    })->name('stock.cpo.supply.page');

    Route::get('/api/stock/cpo-supply-dashboard', [ProductStockReportController::class, 'getCpoSupplyDashboard'])->name('api.stock.cpo.supply');
});
