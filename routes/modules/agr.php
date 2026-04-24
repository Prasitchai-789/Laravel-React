<?php

use App\Http\Controllers\AGR\CustomerController;
use App\Http\Controllers\AGR\ProductController;
use App\Http\Controllers\AGR\SalesController;
use App\Http\Controllers\AGR\StockController;
use App\Http\Controllers\Api\SalesAGRController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:developer.view|agr.view'])->group(function () {
    Route::resource('sales', SalesController::class)->only(['index', 'show', 'create', 'store']);
    Route::resource('/products', ProductController::class);
    Route::put('/products/{product}', [ProductController::class, 'updateProduct'])->name('products.updateProduct');
    Route::put('/stock/{product}', [ProductController::class, 'updateStock'])->name('stock.updateStock');
    Route::resource('/customers', CustomerController::class);

    Route::get('/stock-agr', [StockController::class, 'index'])->name('stock.agr.index');
    Route::post('/stock-agr-product', [ProductController::class, 'storeProduct'])->name('stock.agr.store.product');
    Route::post('/stock-agr', [ProductController::class, 'storeLocation'])->name('stock.agr.store.location');
    Route::delete('/stock-agr/{production}', [ProductController::class, 'destroy'])->name('stock.agr.destroy');
});

Route::middleware(['auth', 'permission:developer.view|agr.edit'])->group(function () {
    Route::resource('sales', SalesController::class)->only(['edit', 'update', 'destroy']);
});

Route::middleware(['auth', 'permission:developer.view|agr.delete'])->group(function () {
    Route::get('/report-by-subdistrict', [SalesAGRController::class, 'reportBySubdistrict']);
    Route::get('/payment-stats', [SalesAGRController::class, 'paymentStats']);
    Route::get('/top-areas', [SalesAGRController::class, 'topAreas']);
    Route::get('/summary-by-product', [SalesAGRController::class, 'summaryByProduct']);
    Route::get('/payment-stats/methods', [SalesAGRController::class, 'paymentMethodStats']);
});
