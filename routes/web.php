<?php

use Inertia\Inertia;
use Dflydev\DotAccessData\Data;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PUR\POController;
use App\Http\Controllers\ERP\ERPController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ChemicalController;
use App\Http\Controllers\AGR\SalesController;
use App\Http\Controllers\AGR\StockController;
use App\Http\Controllers\Api\POInvController;
use App\Http\Controllers\ERP\ShiftController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\Population\PopulationController;
use App\Http\Controllers\StockOrderController;
use App\Http\Controllers\ACC\AccountController;
use App\Http\Controllers\AGR\ProductController;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\Api\SaleMARController;
use App\Http\Controllers\ExportStoreController;
use App\Http\Controllers\StoreExportController;
use App\Http\Controllers\AGR\CustomerController;
use App\Http\Controllers\Api\SalesAGRController;
use App\Http\Controllers\ChemicalOrderController;
use App\Http\Controllers\QAC\CPORecordController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\QAC\SiloRecordController;
use App\Http\Controllers\QAC\StockReportController;
use App\Http\Controllers\Population\PopulationImportController;
use App\Http\Controllers\QAC\StockProductController;
use App\Http\Controllers\Store\StoreOrderController;
use App\Http\Controllers\RPO\PurchaseSummaryController;
use App\Http\Controllers\Store\StoreMovementController;
use App\Http\Controllers\Store\DashboardStoreController;
use App\Http\Controllers\Api\PurchaseDashboardController;
use App\Http\Controllers\QAC\ByProductionStockController;
use App\Http\Controllers\Dashboard\CostAnalysisController;
use App\Http\Controllers\Dashboard\DailyBarCharController;
use App\Http\Controllers\Dashboard\SaleOrderMarController;
use App\Http\Controllers\Dashboard\PalmDashboardController;
use App\Http\Controllers\Dashboard\SalesOrderMarController;
use App\Http\Controllers\Dashboard\PalmProductionController;
use App\Http\Controllers\Dashboard\TableTotalPalmController;
use App\Http\Controllers\Dashboard\ActivityController;
use App\Http\Controllers\Memo\MemoExpenseDocumentController;
use App\Http\Controllers\MUN\FertilizerProductionController;
use App\Http\Controllers\WO\WorkOrderController;
use App\Http\Controllers\Population\PerploController;
use App\Http\Controllers\Population\SummaryControllder;
use App\Http\Controllers\SeederStatusController;


use App\Http\Controllers\MAR\SalesController as MARSalesController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Activity Routes for Dashboard
    Route::get('activity/gallery', [ActivityController::class, 'gallery'])->name('activity.gallery');
    Route::get('activity', [ActivityController::class, 'index'])->name('activity.index');
    Route::post('activity', [ActivityController::class, 'store'])->name('activity.store');
    Route::put('activity/{activity}', [ActivityController::class, 'update'])->name('activity.update');
    Route::delete('activity/{activity}', [ActivityController::class, 'destroy'])->name('activity.destroy');
    Route::post('activity/{activity}/upload-image', [ActivityController::class, 'uploadImage'])->name('activity.upload-image');
    Route::delete('activity-image/{id}', [ActivityController::class, 'deleteImage'])->name('activity-image.delete');

    // Users Routes
    Route::middleware(['permission:users.view|users.create|users.edit|users.delete'])->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    });

    Route::middleware('permission:users.create')->group(function () {
        Route::get('users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
    });

    Route::middleware('permission:users.edit')->group(function () {
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    });

    Route::middleware('permission:users.delete')->group(function () {
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Roles Routes
    Route::resource("roles", RoleController::class)
        ->only(["create", "store"])
        ->middleware(["permission:roles.create"]);
    Route::resource("roles", RoleController::class)
        ->only(["edit", "update"])
        ->middleware(["permission:roles.edit"]);
    Route::resource("roles", RoleController::class)
        ->only(["destroy"])
        ->middleware(["permission:roles.delete"]);
    Route::resource("roles", RoleController::class)
        ->only(["index", "show"])
        ->middleware(["permission:roles.view|roles.create|roles.edit|roles.delete"]);
});

// Projects Routes
Route::middleware(['permission:users.view'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::put('/projects/{id}', [ProjectController::class, 'update'])->name('projects.update');
    Route::get('/projects/{id}', [ProjectController::class, 'projectDetail'])->name('projects.projectDetail');
});

Route::prefix('projects/{project}')->group(function () {
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::post('/milestones', [MilestoneController::class, 'store'])->name('milestones.store');
    Route::put('/milestones/{milestone}', [MilestoneController::class, 'update'])->name('milestones.update');
});

// Chemical Routes
Route::middleware(['permission:users.view|chemical.view'])->group(function () {
    Route::get('chemical', [ChemicalController::class, 'index'])->name('chemical.index');
    Route::get('chemical/{chemical}', [ChemicalController::class, 'show'])->name('chemical.show');
    Route::get('/monthly', [ChemicalController::class, 'monthly'])->name('chemicals.monthly');
    Route::get('/monthly/export-excel', [ChemicalController::class, 'exportExcel'])->name('monthly.exportExcel');
    Route::get('/monthly/export-pdf', [ChemicalController::class, 'exportPdf'])->name('monthly.exportPdf');
});

Route::middleware('permission:users.create')->group(function () {
    Route::get('chemical/create', [ChemicalController::class, 'create'])->name('chemical.create');
    Route::post('chemical', [ChemicalController::class, 'store'])->name('chemical.store');
});

Route::middleware('permission:users.edit')->group(function () {
    Route::get('chemical/{chemical}/edit', [ChemicalController::class, 'edit'])->name('chemical.edit');
    Route::put('chemical/{chemical}', [ChemicalController::class, 'update'])->name('chemical.update');
});

Route::middleware('permission:users.delete')->group(function () {
    Route::delete('chemical/{chemical}', [ChemicalController::class, 'destroy'])->name('chemical.destroy');
    Route::post('/chemical/delete', [ChemicalController::class, 'destroyMultiple'])->name('chemical.delete.multiple');
    Route::delete('/chemical', [ChemicalController::class, 'destroyBulk'])->name('chemical.destroy.bulk');
});

// Chemical Order Routes
Route::prefix('chemicalorder')->group(function () {
    Route::get('/', [ChemicalOrderController::class, 'index'])->name('orders.index');
    Route::get('/{order}', [ChemicalOrderController::class, 'show'])->name('orders.show');
    Route::get('/create', [ChemicalOrderController::class, 'create'])->name('orders.create');
    Route::post('/', [ChemicalOrderController::class, 'store'])->name('orders.store');
    Route::get('/{order}/edit', [ChemicalOrderController::class, 'edit'])->name('orders.edit');
    Route::put('/{order}', [ChemicalOrderController::class, 'update'])->name('orders.update');
    Route::delete('/{order}', [ChemicalOrderController::class, 'destroy'])->name('orders.destroy');
});

// Permissions Routes
Route::middleware(['permission:users.view'])->group(function () {
    Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
    Route::get('permissions/{permission}', [PermissionController::class, 'show'])->name('permissions.show');
});
Route::middleware('permission:users.create')->group(function () {
    Route::get('permissions/create', [PermissionController::class, 'create'])->name('permissions.create');
    Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');
});
Route::middleware('permission:users.edit')->group(function () {
    Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])->name('permissions.edit');
    Route::put('permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
});
Route::middleware('permission:users.delete')->group(function () {
    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');
});

// Purchases Routes
Route::middleware(['permission:users.view'])->group(function () {
    Route::get('purchases/palm', [PurchaseSummaryController::class, 'index'])->name('purchases.index');
    Route::get('purchases/summary', [PurchaseSummaryController::class, 'summary'])->name('purchases.summary');
});

// Citizens / API Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/citizens', [CitizenController::class, 'index'])->name('citizens.index');
    Route::get('/community', [CitizenController::class, 'community'])->name('community');

    Route::post('/upload-citizens', [CitizenController::class, 'upload'])->name('citizens.upload');
    Route::post('/citizens/bulk', [CitizenController::class, 'bulkUpload'])->name('citizens.bulk');
    Route::post('/citizens/clear', [CitizenController::class, 'clearAll'])->name('citizens.clear');
});


// Dashboard Routes
Route::middleware(['auth', 'permission:developer.view'])->group(function () {
    Route::get('palm/table', [TableTotalPalmController::class, 'index'])->name('palm.table.index');
    Route::get('palm/daily', [DailyBarCharController::class, 'index'])->name('palm.daily.index');
    Route::get('palm/production', [PalmProductionController::class, 'index'])->name('palm.production.index');
    Route::get('palm/dashboard', [PalmDashboardController::class, 'index'])->name('palm.dashboard.index');
    Route::get('sales/dashboard', [MARSalesController::class, 'index'])->name('sales.dashboard.index');
    Route::get('cost-analysis/dashboard', [CostAnalysisController::class, 'index'])->name('cost-analysis.dashboard.index');
});

// AGR Routes
Route::middleware(['auth', 'permission:developer.view|agr.view'])->group(function () {
    Route::resource('sales', SalesController::class);
    // Route::post('/sales', [SalesController::class, 'create'])->name('sales.create');
    Route::resource('/products', ProductController::class);
    Route::put('/products/{product}', [ProductController::class, 'updateProduct'])->name('products.updateProduct');
    Route::put('/stock/{product}', [ProductController::class, 'updateStock'])->name('stock.updateStock');
    // Route::get('/products', [ProductController::class, 'index'])->name('product.index');
    Route::resource('/customers', CustomerController::class);
    // Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    // Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    // Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customer.update');

    Route::get('/stock-agr', [StockController::class, 'index'])->name('stock.agr.index');
    Route::post('/stock-agr-product', [ProductController::class, 'storeProduct'])->name('stock.agr.store.product');
    Route::post('/stock-agr', [ProductController::class, 'storeLocation'])->name('stock.agr.store.location');
    Route::delete('/stock-agr/{production}', [ProductController::class, 'destroy'])->name('stock.agr.destroy');
});

// AGR Reports
Route::middleware(['auth', 'permission:developer.view|agr.delete'])->group(function () {
    Route::get('/report-by-subdistrict', [SalesAGRController::class, 'reportBySubdistrict']);
    Route::get('/payment-stats', [SalesAGRController::class, 'paymentStats']);
    Route::get('/top-areas', [SalesAGRController::class, 'topAreas']);
    Route::get('/summary-by-product', [SalesAGRController::class, 'summaryByProduct']);
    Route::get('/payment-stats/methods', [SalesAGRController::class, 'paymentMethodStats']);
});

// MUN Routes
Route::prefix('fertilizer')->group(function () {
    Route::get('/productions', [FertilizerProductionController::class, 'index'])->name('fertilizer.productions.index');
    Route::get('/productions/api', [FertilizerProductionController::class, 'apiIndex'])->name('fertilizer.productions.api');
    Route::post('/productions', [FertilizerProductionController::class, 'store'])->name('fertilizer.productions.store');
    Route::put('/productions/{fertilizerProduction}', [FertilizerProductionController::class, 'update'])->name('fertilizer.productions.update');
    Route::delete('/productions/{fertilizerProduction}', [FertilizerProductionController::class, 'destroy'])->name('fertilizer.productions.destroy');
});


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

    // routes/web.php หรือ routes/api.php
    Route::get('/RecentApprovals', [DashboardStoreController::class, 'recentApprovals']);


    Route::get('/search', [StoreOrderController::class, 'searchJson']);
    // หน้าเลือกสินค้า / Index
    Route::get('/', [StoreOrderController::class, 'index'])->name('Store.index');
    // หน้าเบิกสินค้า
    Route::get('/StoreOrderIssue', [StoreOrderController::class, 'storeOrder'])->name('store-orders.index');

    // หน้าแสดงรายการคำสั่งเบิก
    // ใน routes/web.php
    Route::get('/StoreIssueIndex', [StoreOrderController::class, 'StoreIssueIndex'])
        ->name('StoreIssue.index')
        ->defaults('source', 'WEB'); // ตั้งค่า default เป็น WEB


    Route::get('/StoreMovement', [StoreMovementController::class, 'indexPage'])->name('storemovement.indexPage');
    // แสดงรายละเอียดคำสั่งเบิก
    Route::get('/{order}', [StoreOrderController::class, 'show'])->name('StoreOrder.show');

    // สร้างคำสั่งเบิก (POST)
    Route::post('/', [StoreOrderController::class, 'store'])->name('store-orders.store');


    // ✅ แก้ไข route confirm ให้ถูกต้อง - ใช้ POST กับ path ที่สอดคล้อง
    Route::post('/{order}/confirm', [StoreOrderController::class, 'confirm'])->name('store-orders.confirm');

    // แก้ไขคำสั่งเบิก
    Route::put('/{order}', [StoreOrderController::class, 'update'])->name('StoreOrder.update');

    // ลบคำสั่งเบิก
    Route::delete('/{order}', [StoreOrderController::class, 'destroy'])->name('StoreOrder.destroy');

    Route::post('/return', [StoreOrderController::class, 'return'])->name('store.return');

    Route::get('/store-orders/documents', function () {
        return \App\Models\StoreOrder::select('id', 'document_number', 'order_date', 'status')->get();
    });

    Route::get('/document-items/{documentNumber}', [StoreOrderController::class, 'items']);

    // Export Excel / PDF
    Route::get('/store/export/{id}', [StoreExportController::class, 'export'])
        ->name('store.export-excel'); // ตั้งชื่อให้ตรงกับ Ziggy


    // routes/web.php
    Route::get('/goods/search-new', [StoreOrderController::class, 'searchNew']);
    Route::post('/goods/import-new', [StoreOrderController::class, 'importNew']);

    Route::get('/store-items/stock-info', [StoreOrderController::class, 'getStockInfo']);
    Route::put('/{order}', [StoreOrderController::class, 'update'])
        ->name('store-order.update');
});
// web.php
Route::middleware(['auth'])->prefix('store-movements')->group(function () {

    // สร้าง movement ใหม่
    Route::post('/', [StoreMovementController::class, 'stock'])->name('store-movements.store');
});


// public QR code - ไม่ต้อง login
Route::get('StoreOrder/{order}/qrcode', [StoreOrderController::class, 'showQRCode'])->name('StoreOrder.qrcode');

// web.php
Route::get('/store/issues/export', [ExportStoreController::class, 'export'])->name('store-issues.export');
Route::put('/store-orders/{order}/status', [StoreOrderController::class, 'updateStatus']);


// Memo Routes
Route::middleware(['auth', 'permission:users.view'])->prefix('memo')->group(function () {
    Route::get('/documents', [MemoExpenseDocumentController::class, 'index'])->name('memo.documents.index');
    Route::get('/categories', [MemoExpenseDocumentController::class, 'create'])->name('memo.categories.create');
    Route::get('/documents/api', [MemoExpenseDocumentController::class, 'apiIndex'])->name('memo.documents.api');
    Route::get('/documents/show/{ref_id}', [MemoExpenseDocumentController::class, 'show'])->name('memo.documents.show');
    Route::post('/documents', [MemoExpenseDocumentController::class, 'store'])->name('memo.documents.store');
    Route::put('/documents/{document}', [MemoExpenseDocumentController::class, 'update'])->name('memo.documents.update');
    Route::delete('/documents/{document}', [MemoExpenseDocumentController::class, 'destroy'])->name('memo.documents.destroy');
});

// Route::get('/stock', [StockOrderController::class, 'index'])->name('stock.index');
// Route::post('/api/storeorder', [StockOrderController::class, 'store']);

// errors pages
Route::fallback(function () {
    return Inertia::render('Errors/404')->toResponse(request())->setStatusCode(404);
});




Route::middleware(['auth', 'permission:developer.view'])->group(function () {

    Route::get('purchase/dashboard', [PurchaseDashboardController::class, 'index']);
    Route::get('/purchase/dashboard-json', [PurchaseDashboardController::class, 'apiIndex']);
    Route::get('/purchase/dashboard/api', [PurchaseDashboardController::class, 'apiPOinvByDept'])->name('purchase.dashboard.api');
});


// Dash Board
Route::middleware(['auth', 'permission:developer.view'])->group(function () {

    Route::get('purchase/po', [POController::class, 'index']);
    Route::get('/purchase/po/api', [POController::class, 'apiIndex']);
    Route::get('/purchase/po/show/{id}', [POController::class, 'show'])->name('po.show');
    Route::get('/purchase/po/chart', [POController::class, 'apiPOinvChart'])->name('po.chart');
    Route::get('/expense-by-dept', [POController::class, 'expenseByDept'])->name('expense-by-dept');
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts');
    Route::get('/accounts/api', [AccountController::class, 'getAccounts'])->name('accounts.api');

    Route::get('/sales-mar/api', [SaleMARController::class, 'getSalesWeb'])->name('sales.mar.api');
    Route::get('/sales-mar-win/api', [SaleMARController::class, 'getSalesWin'])->name('sales.mar.win.api');
    Route::get('/poinv-win-summary/api', [POInvController::class, 'getPOInvSummary'])->name('poinv.win.summary.api');
    Route::get('/poinv-win-monthly/api', [POInvController::class, 'getPOInvMonthly'])->name('poinv.win.monthly.api');
});

// MAR Routes
Route::middleware(['auth', 'permission:developer.view|mar.view'])->group(function () {
    Route::get('orders', [MARSalesController::class, 'salesOrder']);
    Route::get('orders/pending', [SalesOrderController::class, 'getSalesOrder']);
    Route::get('/sales-order/{docuNo}/invoices', [SalesOrderController::class, 'getSalesOrderInvoice']);
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


// QAC Routes
Route::middleware(['auth', 'permission:developer.view|qac.view'])->group(function () {
    Route::get('/stock/report', [StockReportController::class, 'index'])->name('stock.report.index');
    Route::get('/stock/cpo', [StockReportController::class, 'stockCPO'])->name('stock.cpo.index');
    Route::get('/cpo', [CPORecordController::class, 'index'])->name('cpo.index');
    Route::post('/cpo', [CPORecordController::class, 'store'])->name('cpo.store');
    Route::put('/cpo/{id}', [CPORecordController::class, 'update'])->name('cpo.update');
    Route::delete('/cpo/{id}', [CPORecordController::class, 'destroy'])->name('cpo.destroy');
    Route::get('/cpo/api', [CPORecordController::class, 'apiRecord'])->name('cpo.api');

    Route::get('/stock/kernel', [SiloRecordController::class, 'index'])->name('stock.kernel.index');
    Route::post('/stock/kernel', [SiloRecordController::class, 'store']);
    Route::get('/stock/kernel/api', [SiloRecordController::class, 'apiRecord'])->name('stock.kernel.api');
    Route::put('/stock/kernel/{siloRecord}', [SiloRecordController::class, 'update']);
    Route::delete('/stock/kernel/{siloRecord}', [SiloRecordController::class, 'destroy'])->name('stock.kernel.destroy');

    Route::get('/stock/by-products', [ByProductionStockController::class, 'index'])->name('stock.by-products.index');
    Route::post('/stock/by-products', [ByProductionStockController::class, 'store'])->name('stock.by-products.store');
    Route::put('/stock/by-products/{id}', [ByProductionStockController::class, 'update'])->name('stock.by-products.update');
    Route::delete('/stock/by-products/{id}', [ByProductionStockController::class, 'destroy'])->name('stock.by-products.destroy');
    Route::get('/stock/by-products/api', [ByProductionStockController::class, 'apiByProduction'])->name('stock.by-products.api');
    Route::get('/stock/productions/api', [ByProductionStockController::class, 'apiGetProduction'])->name('stock.productions.api');
    Route::get('/productions/by-date', [ByProductionStockController::class, 'getByDate']);

    Route::get('/stock/sales/api', [ByProductionStockController::class, 'apiSumSales'])->name('stock.sales.api');
});

// Dashboard QAC Routes
Route::middleware(['auth', 'permission:developer.view|qac.view'])->group(function () {
    Route::get('/report/sales/api', [StockReportController::class, 'apiSummarySales'])->name('report.sales.api');
    Route::get('/report/productions/api', [StockReportController::class, 'apiProductions'])->name('report.productions.api');
    Route::get('/report/stock-cpo/api', [StockReportController::class, 'apiStockCPO'])->name('report.stock-cpo.api');
    Route::get('/report/stock-cpo/summary', [StockReportController::class, 'summary']);
    Route::get('/report/stock-cpo/date/{date}', [StockReportController::class, 'getStockCpoByDate']);
    Route::get('/cpo/previous/date/{date}', [StockReportController::class, 'getStockCpoByDatePrevious']);
    Route::get('/report/stock-cpo/historical', [StockReportController::class, 'getHistoricalData'])->name('report.stock-cpo.historical');
    Route::get('/report/productions/summary', [StockProductController::class, 'apiProduction']);
});

// Dashboard QAC Routes
Route::middleware(['auth', 'permission:users.view'])->group(function () {
    Route::get('/populations', [PopulationController::class, 'index'])->name('populations.index');
    Route::get('/populations/create', [PopulationController::class, 'onCreate']);
    Route::get('/populations/table', [PopulationImportController::class, 'table'])
        ->name('populations.table');

    Route::post('/population/import', [PopulationImportController::class, 'import'])
        ->name('population.import');
    Route::post('/population/createpopulation',[PopulationController::class,'CreatePopulation']);
    Route::get('/getSeederStatusItems',[PopulationController::class,'getSeederStatusItems']);
    Route::get('/summary',[PopulationController::class,'summary']);
    Route::get('/summaryJson',[PopulationController::class,'summaryJson']);
    Route::get('/getLocationSakon', [SummaryControllder::class, 'getProvinceSakon']);
});



Route::middleware(['auth', 'permission:ERP.view'])->group(function () {
    Route::get('/ERPIndex', [ERPController::class, 'index']);
    Route::get('/ERPDashboard', [ERPController::class, 'Dashboard']);
    Route::get('/ERPDetail', [ERPController::class, 'Detail']);
    Route::get('/ImportExcel', [ERPController::class, 'ImportExcel']);
    Route::get('/shifts', [ERPController::class, 'shifts']);
    Route::get('/overtime', [ERPController::class, 'overtime']);
    Route::get('/erp', [ERPController::class, 'index'])->name('erp.index');


    // Shifts CRUD
    // Route::get('/shifts', [ShiftController::class, 'shifts'])->name('shifts.index');
    Route::post('/shifts', [ShiftController::class, 'store'])->name('shifts.store');
    Route::put('/shifts/{id}', [ShiftController::class, 'update'])->name('shifts.update');
    Route::delete('/shifts/{id}', [ShiftController::class, 'destroy'])->name('shifts.destroy');
});



Route::middleware(['auth', 'permission:users.view'])->group(function () {
    Route::get('/WOIndex', [WorkOrderController::class, 'index']);
    Route::get('/OrderIndex', [WorkOrderController::class, 'Order']);
});
Route::middleware(['auth', 'permission:users.view'])->group(function () {
    Route::get('/preplo', [PerploController::class, 'index']);
    Route::post('/preplo/import-simple', [PopulationController::class, 'importSimple']);


});


// Route::middleware(['auth', 'permission:users.view'])->group(function () {
//     Route::post('/seeder-status/{user}', [SeederStatusController::class, 'update']);
//     Route::post('/seeder-status/{user}/add-item/{itemId}', [SeederStatusController::class, 'addItem']);
// });

// Car Usage Report Routes
Route::middleware(['auth', 'permission:users.view'])->group(function () {
    Route::get('/car-usage-report', [\App\Http\Controllers\CarUsageReportController::class, 'index'])->name('car-usage-report.index');
    Route::get('/car-usage-report/api', [\App\Http\Controllers\CarUsageReportController::class, 'apiData'])->name('car-usage-report.api');
    Route::get('/car-usage-report/export', [\App\Http\Controllers\CarUsageReportController::class, 'export'])->name('car-usage-report.export');
    
    // User Car Usage Report
    Route::get('/user-car-usage-report', [\App\Http\Controllers\UserCarUsageReportController::class, 'index'])->name('user-car-usage-report.index');
    Route::get('/user-car-usage-report/api', [\App\Http\Controllers\UserCarUsageReportController::class, 'apiData'])->name('user-car-usage-report.api');
    Route::get('/user-car-usage-report/export', [\App\Http\Controllers\UserCarUsageReportController::class, 'export'])->name('user-car-usage-report.export');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
