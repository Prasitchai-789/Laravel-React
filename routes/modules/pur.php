<?php

use App\Http\Controllers\ExportStoreController;
use App\Http\Controllers\Store\DashboardStoreController;
use App\Http\Controllers\Store\StoreMovementController;
use App\Http\Controllers\Store\StoreOrderController;
use App\Http\Controllers\StoreExportController;
use App\Models\StoreOrder;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:users.view|PUR.view'])->prefix('StoreOrder')->group(function () {
    Route::get('/getWithdrawalStats', [DashboardStoreController::class, 'getWithdrawalStats']);
    Route::get('/Chart', [DashboardStoreController::class, 'Chart']);
    Route::get('/QuickSummary', [DashboardStoreController::class, 'QuickSummary']);
    Route::get('/Dashboard', [DashboardStoreController::class, 'Dashboard']);
    Route::get('/Withdrawal', [DashboardStoreController::class, 'Withdrawal']);
    Route::get('/StockOrder', [DashboardStoreController::class, 'StockOrder']);
    Route::get('/Departments', [DashboardStoreController::class, 'Departments']);
    Route::get('/Budget', [DashboardStoreController::class, 'ApprovedBudget']);
    Route::get('/nameOrder', [DashboardStoreController::class, 'nameOrder']);
    Route::get('/RecentApprovals', [DashboardStoreController::class, 'recentApprovals']);

    Route::get('/search', [StoreOrderController::class, 'searchJson']);
    Route::get('/', [StoreOrderController::class, 'index'])->name('Store.index');
    Route::get('/StoreOrderIssue', [StoreOrderController::class, 'storeOrder'])->name('store-orders.index');

    Route::get('/StoreIssueIndex', [StoreOrderController::class, 'StoreIssueIndex'])
        ->name('StoreIssue.index')
        ->defaults('source', 'WEB');

    Route::get('/StoreMovement', [StoreMovementController::class, 'indexPage'])->name('storemovement.indexPage');
    Route::get('/{order}', [StoreOrderController::class, 'show'])->name('StoreOrder.show');
    Route::post('/', [StoreOrderController::class, 'store'])->name('store-orders.store');
    Route::post('/{order}/confirm', [StoreOrderController::class, 'confirm'])->name('store-orders.confirm');
    Route::put('/{order}', [StoreOrderController::class, 'update'])->name('StoreOrder.update');
    Route::delete('/{order}', [StoreOrderController::class, 'destroy'])->name('StoreOrder.destroy');
    Route::post('/return', [StoreOrderController::class, 'return'])->name('store.return');

    Route::get('/store-orders/documents', function () {
        return StoreOrder::select('id', 'document_number', 'order_date', 'status')->get();
    });

    Route::get('/document-items/{documentNumber}', [StoreOrderController::class, 'items']);
    Route::get('/store/export/{id}', [StoreExportController::class, 'export'])->name('store.export-excel');
    Route::get('/goods/search-new', [StoreOrderController::class, 'searchNew']);
    Route::post('/goods/import-new', [StoreOrderController::class, 'importNew']);
    Route::get('/store-items/stock-info', [StoreOrderController::class, 'getStockInfo']);
    Route::put('/{order}', [StoreOrderController::class, 'update'])->name('store-order.update');
});

Route::middleware(['auth'])->prefix('store-movements')->group(function () {
    Route::post('/', [StoreMovementController::class, 'stock'])->name('store-movements.store');
});

Route::get('StoreOrder/{order}/qrcode', [StoreOrderController::class, 'showQRCode'])->name('StoreOrder.qrcode');

Route::middleware(['auth', 'permission:users.view|PUR.view'])->group(function () {
    Route::get('/store/issues/export', [ExportStoreController::class, 'export'])->name('store-issues.export');
    Route::put('/store-orders/{order}/status', [StoreOrderController::class, 'updateStatus']);
});
