<?php

use App\Http\Controllers\CCTV\CctvController;
use App\Http\Controllers\CCTV\DvrController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:developer.view|it.view'])->group(function () {
    Route::get('/cctv-inspection', [CctvController::class, 'index'])->name('cctv.index');
    Route::get('/cctv-inspection/overview', [CctvController::class, 'monthlyOverviewPage'])->name('cctv.overview');
    Route::get('/cctv-inspection/form/{id}', [CctvController::class, 'form'])->name('cctv.form');
    Route::get('/cctv-inspection/api', [CctvController::class, 'apiData'])->name('cctv.api');
    Route::get('/cctv-inspection/api/{id}', [CctvController::class, 'show'])->name('cctv.show');
    Route::get('/cctv-inspection/monthly-api', [CctvController::class, 'getMonthlyOverview'])->name('cctv.monthly.api');
    Route::post('/cctv-inspection', [CctvController::class, 'store'])->name('cctv.store');

    Route::get('/dvrs', [DvrController::class, 'index'])->name('dvrs.index');
    Route::get('/dvrs/api', [DvrController::class, 'apiIndex'])->name('dvrs.api');
    Route::post('/dvrs', [DvrController::class, 'store'])->name('dvrs.store');
    Route::put('/dvrs/{dvr}', [DvrController::class, 'update'])->name('dvrs.update');
    Route::delete('/dvrs/{dvr}', [DvrController::class, 'destroy'])->name('dvrs.destroy');
});
