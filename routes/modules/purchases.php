<?php

use App\Http\Controllers\RPO\PurchaseSummaryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:users.view|mar.edit'])->group(function () {
    Route::get('purchases/palm', [PurchaseSummaryController::class, 'index'])->name('purchases.index');
    Route::get('purchases/summary', [PurchaseSummaryController::class, 'summary'])->name('purchases.summary');
});
