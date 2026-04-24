<?php

use App\Http\Controllers\CarUsageReportController;
use App\Http\Controllers\UserCarUsageReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:users.view'])->group(function () {
    Route::get('/car-usage-report', [CarUsageReportController::class, 'index'])->name('car-usage-report.index');
    Route::get('/car-usage-report/api', [CarUsageReportController::class, 'apiData'])->name('car-usage-report.api');
    Route::get('/car-usage-report/export', [CarUsageReportController::class, 'export'])->name('car-usage-report.export');

    Route::get('/user-car-usage-report', [UserCarUsageReportController::class, 'index'])->name('user-car-usage-report.index');
    Route::get('/user-car-usage-report/api', [UserCarUsageReportController::class, 'apiData'])->name('user-car-usage-report.api');
    Route::get('/user-car-usage-report/export', [UserCarUsageReportController::class, 'export'])->name('user-car-usage-report.export');
});
