<?php

use App\Http\Controllers\Api\Dashboard\CycleTimeController;
use App\Http\Controllers\Api\Dashboard\PalmAnalyticsController;
use App\Http\Controllers\ChemicalController;
use App\Http\Controllers\ChemicalMasterController;
use App\Http\Controllers\ChemicalOrderController;
use App\Http\Controllers\Dashboard\ProductionDashboardController;
use App\Http\Controllers\PRO\ProductionController;
use App\Http\Controllers\PRO\ProductionReportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'permission:gm.view|chemical.view|developer.view|pro.view'])->group(function () {
    Route::get('/production-dashboard', function () {
        return Inertia::render('Production/Dashboard');
    })->name('production.dashboard');

    Route::get('/palm/analytics', function () {
        return Inertia::render('Production/PalmAnalytics');
    })->name('palm.analytics');

    Route::get('/chemical-master', [ChemicalMasterController::class, 'index'])->name('chemical-master.index');
    Route::post('/chemical-master', [ChemicalMasterController::class, 'store'])->name('chemical-master.store');
    Route::put('/chemical-master/{id}', [ChemicalMasterController::class, 'update'])->name('chemical-master.update');
    Route::delete('/chemical-master/{id}', [ChemicalMasterController::class, 'destroy'])->name('chemical-master.destroy');
    Route::get('/api/chemicals', [ChemicalMasterController::class, 'apiList'])->name('api.chemicals');
});

Route::middleware(['permission:gm.view|chemical.view|developer.view'])->group(function () {
    Route::get('chemical', [ChemicalController::class, 'index'])->name('chemical.index');
    Route::get('chemical/{chemical}', [ChemicalController::class, 'show'])->name('chemical.show');
    Route::get('/monthly', [ChemicalController::class, 'monthly'])->name('chemicals.monthly');
    Route::get('/monthly/export-excel', [ChemicalController::class, 'exportExcel'])->name('monthly.exportExcel');
    Route::get('/monthly/export-pdf', [ChemicalController::class, 'exportPdf'])->name('monthly.exportPdf');
});

Route::middleware('permission:users.create|developer.view|gm.view')->group(function () {
    Route::get('chemical/create', [ChemicalController::class, 'create'])->name('chemical.create');
    Route::post('chemical', [ChemicalController::class, 'store'])->name('chemical.store');
});

Route::middleware('permission:users.edit|developer.view|gm.view')->group(function () {
    Route::get('chemical/{chemical}/edit', [ChemicalController::class, 'edit'])->name('chemical.edit');
    Route::put('chemical/{chemical}', [ChemicalController::class, 'update'])->name('chemical.update');
});

Route::middleware('permission:users.delete|developer.view|gm.view')->group(function () {
    Route::delete('chemical/{chemical}', [ChemicalController::class, 'destroy'])->name('chemical.destroy');
    Route::post('/chemical/delete', [ChemicalController::class, 'destroyMultiple'])->name('chemical.delete.multiple');
    Route::delete('/chemical', [ChemicalController::class, 'destroyBulk'])->name('chemical.destroy.bulk');
});

Route::middleware(['permission:users.view|chemical.view|developer.view|gm.view'])->prefix('chemicalorder')->group(function () {
    Route::get('/', [ChemicalOrderController::class, 'index'])->name('orders.index');
    Route::get('/{order}', [ChemicalOrderController::class, 'show'])->name('orders.show');
    Route::get('/create', [ChemicalOrderController::class, 'create'])->name('orders.create');
    Route::post('/', [ChemicalOrderController::class, 'store'])->name('orders.store');
    Route::get('/{order}/edit', [ChemicalOrderController::class, 'edit'])->name('orders.edit');
    Route::put('/{order}', [ChemicalOrderController::class, 'update'])->name('orders.update');
    Route::delete('/{order}', [ChemicalOrderController::class, 'destroy'])->name('orders.destroy');
});

Route::middleware(['auth', 'permission:users.view|chemical.view|developer.view|pro.view|gm.view'])->group(function () {
    Route::get('/pro/production-record', [ProductionController::class, 'index'])->name('pro.production.index');
    Route::get('/pro/production-record/date-info', [ProductionController::class, 'dateInfo'])->name('pro.production.dateInfo');
    Route::get('/pro/production-record/export', [ProductionController::class, 'export'])->name('pro.production.export');
    Route::post('/pro/production-record', [ProductionController::class, 'store'])->name('pro.production.store');
    Route::put('/pro/production-record/{id}', [ProductionController::class, 'update'])->name('pro.production.update');
    Route::delete('/pro/production-record/{id}', [ProductionController::class, 'destroy'])->name('pro.production.destroy');
    Route::get('/pro/production-report', [ProductionReportController::class, 'index'])->name('pro.production.report');
});

Route::middleware(['auth', 'permission:users.view|chemical.view|developer.view|pro.view|gm.view'])->prefix('api/dashboard')->group(function () {
    Route::get('/production', [ProductionDashboardController::class, 'apiData']);
    Route::get('/cycle-time', [CycleTimeController::class, 'index']);
    Route::get('/palm-analytics', [PalmAnalyticsController::class, 'intake']);
});
