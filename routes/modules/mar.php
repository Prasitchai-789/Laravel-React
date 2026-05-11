<?php

use App\Http\Controllers\Api\SaleMARController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\VehicleInspectionController;
use App\Http\Controllers\Dashboard\SalesOrderMarController;
use App\Http\Controllers\MAR\DeliveryPlanController;
use App\Http\Controllers\MAR\SalesController as MARSalesController;
use App\Http\Controllers\MAR\SOPlanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/delivery-plan', [DeliveryPlanController::class, 'page'])->name('delivery-plan.page');

    Route::prefix('api/delivery-plan')->group(function () {
        Route::get('/lookups', [DeliveryPlanController::class, 'lookups']);
        Route::get('/references', [DeliveryPlanController::class, 'getReferences']);
        Route::post('/reference', [DeliveryPlanController::class, 'updateReference']);
        Route::get('/{date}', [DeliveryPlanController::class, 'index']);
        Route::post('/order', [DeliveryPlanController::class, 'storeOrder']);
        Route::post('/order/complete', [DeliveryPlanController::class, 'completeOrder']);
        Route::post('/update', [DeliveryPlanController::class, 'update']);
    });
});

Route::middleware(['auth', 'permission:developer.view|mar.view|mar.edit|gm.view'])->group(function () {
    Route::get('orders', [MARSalesController::class, 'salesOrder']);
    Route::get('orders/pending', [SalesOrderController::class, 'getSalesOrder']);
    Route::get('/sales-order/{docuNo}/invoices', [SalesOrderController::class, 'getSalesOrderInvoice']);
    Route::get('/sales-order/production-lot/{sopid}', [SalesOrderController::class, 'getProductionLot']);
    Route::get('/sales-order', [SalesOrderMarController::class, 'index'])->name('sales.order.index');
    Route::get('/sales-order-summary/api', [SaleMARController::class, 'getSalesOrder'])->name('sales.order.api');
    Route::get('/sales/dashboard', [MARSalesController::class, 'index'])->name('sales.index');
    Route::get('/sales-summary/api', [SaleMARController::class, 'getSalesSummary'])->name('sales.summary.api');
    Route::get('/market-price/api', [SaleMARController::class, 'getMarketPrice']);
    Route::get('/trends-3y/api', [SaleMARController::class, 'getTrends3Y']);
    Route::get('/conversion/api', [SaleMARController::class, 'getConversion']);
    Route::get('/loss-analysis/api', [SaleMARController::class, 'getLossAnalysis']);
    Route::get('/top-customers/api', [SaleMARController::class, 'getTopCustomers']);
});

Route::middleware(['auth', 'permission:developer.view|mar.view|gm.view|qac.view|qac.edit|qac.delete'])->prefix('mar')->name('mar.')->group(function () {
    Route::get('/plan-order', [SOPlanController::class, 'index'])->name('plan-order.index');
    Route::get('/plan-order/data/{id}', [SOPlanController::class, 'show'])->name('plan-order.data-item');
    Route::get('/plan-order/pending-coa', [SOPlanController::class, 'pendingCOA'])->name('plan-order.pending-coa');

    Route::get('/vehicle-inspections/{sop_id}', [VehicleInspectionController::class, 'show']);
    Route::post('/vehicle-inspections', [VehicleInspectionController::class, 'store']);

    Route::post('/plan-order', [SOPlanController::class, 'store'])->name('plan-order.store');
    Route::put('/plan-order/{id}', [SOPlanController::class, 'update'])->name('plan-order.update');
    Route::put('/plan-order/{id}/status', [SOPlanController::class, 'updateStatus'])->name('plan-order.update-status');
    Route::post('/plan-order/{id}/generate-coa', [SOPlanController::class, 'generateCoa'])->name('plan-order.generate-coa');
    Route::delete('/plan-order/{id}', [SOPlanController::class, 'destroy'])->name('plan-order.destroy');
    Route::patch('/plan-order/{id}/restore', [SOPlanController::class, 'restore'])->name('plan-order.restore');
    Route::delete('/plan-order/{id}/force', [SOPlanController::class, 'forceDelete'])->name('plan-order.force-delete');
});
