<?php

use App\Http\Controllers\QMR\RiskManagementController;
use App\Http\Controllers\QMR\WaterUsageReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('qmr')->name('qmr.')->group(function () {
    Route::middleware(['permission:qmr.view|qmr.edit|qmr.delete|admin.view|admin.edit|developer.view|gm.view|qac.view'])->group(function () {
        Route::get('/risk-management', [RiskManagementController::class, 'index'])->name('risk-management.index');
        Route::get('/risk-management/risks', [RiskManagementController::class, 'risks'])->name('risk-management.risks');
        Route::get('/risk-management/kpi', [RiskManagementController::class, 'kpis'])->name('risk-management.kpi');
        Route::get('/risk-management/controls', [RiskManagementController::class, 'controls'])->name('risk-management.controls');
        Route::get('/risk-management/reports', [RiskManagementController::class, 'reports'])->name('risk-management.reports');

        Route::get('/water-usage-reports', [WaterUsageReportController::class, 'index'])->name('water-usage-reports.index');
    });

    Route::middleware(['permission:qmr.edit|admin.edit|developer.view'])->group(function () {
        Route::get('/risk-management/risks/create', [RiskManagementController::class, 'create'])->name('risk-management.create');
        Route::post('/risk-management/risks', [RiskManagementController::class, 'store'])->name('risk-management.store');
        Route::get('/risk-management/risks/{risk}/edit', [RiskManagementController::class, 'edit'])->name('risk-management.edit');
        Route::put('/risk-management/risks/{risk}', [RiskManagementController::class, 'update'])->name('risk-management.update');

        Route::get('/risk-management/kpi/create', [RiskManagementController::class, 'createKpi'])->name('risk-management.kpi.create');
        Route::post('/risk-management/kpi', [RiskManagementController::class, 'storeKpi'])->name('risk-management.kpi.store');
        Route::get('/risk-management/kpi/{kpi}/edit', [RiskManagementController::class, 'editKpi'])->name('risk-management.kpi.edit');
        Route::put('/risk-management/kpi/{kpi}', [RiskManagementController::class, 'updateKpi'])->name('risk-management.kpi.update');

        Route::get('/risk-management/controls/create', [RiskManagementController::class, 'createControl'])->name('risk-management.controls.create');
        Route::post('/risk-management/controls', [RiskManagementController::class, 'storeControl'])->name('risk-management.controls.store');
        Route::get('/risk-management/controls/{control}/edit', [RiskManagementController::class, 'editControl'])->name('risk-management.controls.edit');
        Route::put('/risk-management/controls/{control}', [RiskManagementController::class, 'updateControl'])->name('risk-management.controls.update');

        Route::post('/water-usage-reports', [WaterUsageReportController::class, 'store'])->name('water-usage-reports.store');
        Route::put('/water-usage-reports/{waterUsageReport}', [WaterUsageReportController::class, 'update'])->name('water-usage-reports.update');
    });

    Route::middleware(['permission:qmr.delete|admin.delete|developer.view'])->group(function () {
        Route::delete('/risk-management/risks/{risk}', [RiskManagementController::class, 'destroy'])->name('risk-management.destroy');
        Route::delete('/risk-management/kpi/{kpi}', [RiskManagementController::class, 'destroyKpi'])->name('risk-management.kpi.destroy');
        Route::delete('/risk-management/controls/{control}', [RiskManagementController::class, 'destroyControl'])->name('risk-management.controls.destroy');
        Route::delete('/water-usage-reports/{waterUsageReport}', [WaterUsageReportController::class, 'destroy'])->name('water-usage-reports.destroy');
    });
});
