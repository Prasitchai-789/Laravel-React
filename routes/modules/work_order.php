<?php

use App\Http\Controllers\WO\WorkOrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:users.view'])->group(function () {
    Route::get('/WOIndex', [WorkOrderController::class, 'index']);
    Route::get('/OrderIndex', [WorkOrderController::class, 'Order']);
});
