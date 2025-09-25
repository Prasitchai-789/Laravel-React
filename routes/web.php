<?php

use Inertia\Inertia;
use Dflydev\DotAccessData\Data;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ChemicalController;
use App\Http\Controllers\AGR\SalesController;
use App\Http\Controllers\AGR\StockController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\AGR\ProductController;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\AGR\CustomerController;
use App\Http\Controllers\ChemicalOrderController;
use App\Http\Controllers\RPO\PurchaseSummaryController;
use App\Http\Controllers\Dashboard\CostAnalysisController;
use App\Http\Controllers\Dashboard\DailyBarCharController;
use App\Http\Controllers\Dashboard\PalmDashboardController;
use App\Http\Controllers\Dashboard\PalmProductionController;
use App\Http\Controllers\Dashboard\TableTotalPalmController;
use App\Http\Controllers\MUN\FertilizerProductionController;
use App\Http\Controllers\MAR\SalesController as MARSalesController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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
Route::middleware(['permission:users.view'])->group(function () {
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
    Route::get('purchases', [PurchaseSummaryController::class, 'index'])->name('purchases.index');
    Route::get('purchases/summary', [PurchaseSummaryController::class, 'summary'])->name('purchases.summary');
});

// Citizens / API Routes
Route::get('/citizens', [CitizenController::class, 'index']);
Route::get('/citizens/communitypage', [CitizenController::class, 'community']);


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
    Route::put('/products/{product}', [ProductController::class, 'updateProduct'])->name( 'products.updateProduct');
    Route::put('/stock/{product}', [ProductController::class, 'updateStock'])->name( 'stock.updateStock');
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


// MUN Routes
Route::prefix('fertilizer')->group(function () {
    Route::get('/productions', [FertilizerProductionController::class, 'index'])->name('fertilizer.productions.index');
    Route::get('/productions/api', [FertilizerProductionController::class, 'apiIndex'])->name('fertilizer.productions.api');
    Route::post('/productions', [FertilizerProductionController::class, 'store'])->name('fertilizer.productions.store');
    Route::put('/productions/{fertilizerProduction}', [FertilizerProductionController::class, 'update'])->name('fertilizer.productions.update');
    Route::delete('/productions/{fertilizerProduction}', [FertilizerProductionController::class, 'destroy'])->name('fertilizer.productions.destroy');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
