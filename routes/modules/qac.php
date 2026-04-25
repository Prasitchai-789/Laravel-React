<?php

use App\Http\Controllers\QAC\ByProductionStockController;
use App\Http\Controllers\QAC\COA\COAController;
use App\Http\Controllers\QAC\CPORecordController;
use App\Http\Controllers\QAC\MillDailyReportController;
use App\Http\Controllers\QAC\SiloRecordController;
use App\Http\Controllers\QAC\SkimMixRecordController;
use App\Http\Controllers\QAC\StockProductController;
use App\Http\Controllers\QAC\StockReportController;
use App\Http\Controllers\QAC\YieldReportController;
use App\Http\Controllers\QAC\YieldTableController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'permission:developer.view|qac.view|gm.view|mar.edit'])->group(function () {
    Route::get('/qac/mill-daily-report', [MillDailyReportController::class, 'index'])->name('qac.mill-report');
    Route::get('/api/qac/mill-daily-data', [MillDailyReportController::class, 'getData']);
    Route::post('/api/qac/mill-daily-additional', [MillDailyReportController::class, 'saveAdditionalData']);

    Route::redirect('/qac/coa', '/qac/coa/oil');

    Route::get('/qac/coa/oil', function () {
        return Inertia::render('QAC/COA/Oil_COA/Oil_COA');
    })->name('qac.coa.oil');

    Route::get('/qac/coa/seed', function () {
        return Inertia::render('QAC/COA/Seed_COA/Seed_COA');
    })->name('qac.coa.seed');

    Route::post('/qac/coa/store', [COAController::class, 'store'])->name('qac.coa.store');
    Route::post('/qac/coa/approve', [COAController::class, 'approve'])->name('qac.coa.approve');
    Route::post('/qac/coa/cancel', [COAController::class, 'cancel'])->name('qac.coa.cancel');

    Route::get('/stock/report', [StockReportController::class, 'index'])->name('stock.report.index');
    Route::get('/stock/cpo', [StockReportController::class, 'stockCPO'])->name('stock.cpo.index');
    Route::get('/cpo', [CPORecordController::class, 'index'])->name('cpo.index');
    Route::post('/cpo', [CPORecordController::class, 'store'])->name('cpo.store');
    Route::put('/cpo/{id}', [CPORecordController::class, 'update'])->name('cpo.update');
    Route::delete('/cpo/{id}', [CPORecordController::class, 'destroy'])->name('cpo.destroy');
    Route::get('/cpo/api', [CPORecordController::class, 'apiRecord'])->name('cpo.api');

    Route::get('/skim-mix', [SkimMixRecordController::class, 'index'])->name('skim-mix.index');
    Route::post('/skim-mix', [SkimMixRecordController::class, 'store'])->name('skim-mix.store');
    Route::get('/skim-mix/api', [SkimMixRecordController::class, 'apiRecords'])->name('skim-mix.api');
    Route::get('/skim-mix/summary', [SkimMixRecordController::class, 'apiSummary'])->name('skim-mix.summary');
    Route::get('/skim-mix/prefill', [SkimMixRecordController::class, 'apiPrefillData'])->name('skim-mix.prefill');
    Route::put('/skim-mix/{id}', [SkimMixRecordController::class, 'update'])->name('skim-mix.update');
    Route::delete('/skim-mix/{id}', [SkimMixRecordController::class, 'destroy'])->name('skim-mix.destroy');

    Route::get('/yield-report', [YieldReportController::class, 'index'])->name('yield-report.index');
    Route::get('/yield-report/api', [YieldReportController::class, 'apiData'])->name('yield-report.api');
    Route::get('/yield-report/monthly', [YieldReportController::class, 'apiMonthlyYield'])->name('yield-report.monthly');
    Route::get('/yield-table', [YieldTableController::class, 'index'])->name('yield-table.index');
    Route::get('/yield-table/api', [YieldTableController::class, 'apiData'])->name('yield-table.api');
    Route::get('/yield-table/export', [YieldTableController::class, 'export'])->name('yield-table.export');

    Route::get('/stock/kernel', [SiloRecordController::class, 'index'])->name('stock.kernel.index');
    Route::post('/stock/kernel', [SiloRecordController::class, 'store']);
    Route::get('/stock/kernel/api', [SiloRecordController::class, 'apiRecord'])->name('stock.kernel.api');
    Route::put('/stock/kernel/{siloRecord}', [SiloRecordController::class, 'update']);
    Route::delete('/stock/kernel/{siloRecord}', [SiloRecordController::class, 'destroy'])->name('stock.kernel.destroy');
    Route::get('/stock/kernel/no-production-data', [SiloRecordController::class, 'apiKernelNoProductionData'])->name('stock.kernel.no-production-data');

    Route::get('/stock/by-products', [ByProductionStockController::class, 'index'])->name('stock.by-products.index');
    Route::post('/stock/by-products', [ByProductionStockController::class, 'store'])->name('stock.by-products.store');
    Route::put('/stock/by-products/{id}', [ByProductionStockController::class, 'update'])->name('stock.by-products.update');
    Route::delete('/stock/by-products/{id}', [ByProductionStockController::class, 'destroy'])->name('stock.by-products.destroy');
    Route::get('/stock/by-products/api', [ByProductionStockController::class, 'apiByProduction'])->name('stock.by-products.api');
    Route::get('/stock/productions/api', [ByProductionStockController::class, 'apiGetProduction'])->name('stock.productions.api');
    Route::get('/productions/by-date', [ByProductionStockController::class, 'getByDate']);

    Route::get('/stock/sales/api', [ByProductionStockController::class, 'apiSumSales'])->name('stock.sales.api');
    Route::get('/stock/by-products/previous-balance', [ByProductionStockController::class, 'apiPreviousBalance'])->name('stock.by-products.previous-balance');
});

Route::middleware(['auth', 'permission:developer.view|qac.view|gm.view|mar.edit'])->group(function () {
    Route::get('/report/sales/api', [StockReportController::class, 'apiSummarySales'])->name('report.sales.api');
    Route::get('/report/productions/api', [StockReportController::class, 'apiProductions'])->name('report.productions.api');
    Route::get('/report/stock-cpo/api', [StockReportController::class, 'apiStockCPO'])->name('report.stock-cpo.api');
    Route::get('/report/stock-cpo/summary', [StockReportController::class, 'summary']);
    Route::get('/report/stock-cpo/date/{date}', [StockReportController::class, 'getStockCpoByDate']);
    Route::get('/cpo/previous/date/{date}', [StockReportController::class, 'getStockCpoByDatePrevious']);
    Route::get('/report/stock-cpo/historical', [StockReportController::class, 'getHistoricalData'])->name('report.stock-cpo.historical');
    Route::get('/report/productions/summary', [StockProductController::class, 'apiProduction']);
    Route::get('/report/productions2/summary', [StockProductController::class, 'apiProductionReport2']);
    Route::get('/stock/production-report', function () {
        return Inertia::render('QAC/ProductionReport2', []);
    })->name('stock.production-report');
});
