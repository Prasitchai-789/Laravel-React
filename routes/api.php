<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectController;

Route::prefix('projects')->group(function () {
    Route::get('/', [ProjectController::class, 'index']);       // ดึงทั้งหมด พร้อม pagination, filter, search
    Route::get('/{id}', [ProjectController::class, 'show']);   // ดึง Project ตาม ID
});

use App\Http\Controllers\Api\MonitoringController;

Route::post('/monitoring/agent/report', [MonitoringController::class, 'reportMetrics']);

Route::get('/market-price/palm', [\App\Http\Controllers\Api\MarketPriceController::class, 'getPalmPrices']);
