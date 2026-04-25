<?php

use App\Http\Controllers\QMR\WaterUsageReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:qmr.view|admin.view|developer.view|gm.view|qac.view'])->prefix('qmr')->name('qmr.')->group(function () {
    Route::get('/water-usage-reports', [WaterUsageReportController::class, 'index'])->name('water-usage-reports.index');
    Route::post('/water-usage-reports', [WaterUsageReportController::class, 'store'])->name('water-usage-reports.store');
    Route::put('/water-usage-reports/{waterUsageReport}', [WaterUsageReportController::class, 'update'])->name('water-usage-reports.update');
    Route::delete('/water-usage-reports/{waterUsageReport}', [WaterUsageReportController::class, 'destroy'])->name('water-usage-reports.destroy');
});
