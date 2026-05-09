<?php

use Inertia\Inertia;
use Dflydev\DotAccessData\Data;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\Admin\ApiSummaryController;
use App\Http\Controllers\Admin\PageAccessLogController;
use App\Http\Controllers\Dashboard\ActivityController;

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
        Route::get('api/employees', [UserController::class, 'getEmployees'])->name('api.employees');
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

    Route::middleware('permission:admin.edit')->group(function () {
        Route::get('admin/page-access-logs', [PageAccessLogController::class, 'index'])->name('admin.page-access-logs.index');
        Route::get('admin/api-summary', [ApiSummaryController::class, 'index'])->name('admin.api-summary.index');
    });
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
require __DIR__ . '/modules/pro.php';

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

require __DIR__ . '/modules/purchases.php';

// Citizens / API Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/citizens', [CitizenController::class, 'index'])->name('citizens.index');
    Route::get('/community', [CitizenController::class, 'community'])->name('community');

    Route::post('/upload-citizens', [CitizenController::class, 'upload'])->name('citizens.upload');
    Route::post('/citizens/bulk', [CitizenController::class, 'bulkUpload'])->name('citizens.bulk');
    Route::post('/citizens/clear', [CitizenController::class, 'clearAll'])->name('citizens.clear');
});


require __DIR__ . '/modules/dashboard.php';

require __DIR__ . '/modules/agr.php';

require __DIR__ . '/modules/fertilizer.php';

require __DIR__ . '/modules/pur.php';

require __DIR__ . '/modules/memo.php';

// Route::get('/stock', [StockOrderController::class, 'index'])->name('stock.index');
// Route::post('/api/storeorder', [StockOrderController::class, 'store']);

require __DIR__ . '/modules/monitoring.php';

require __DIR__ . '/modules/patrol.php';

require __DIR__ . '/modules/computer.php';

require __DIR__ . '/modules/cctv.php';

require __DIR__ . '/modules/mar.php';

require __DIR__ . '/modules/qac.php';

require __DIR__ . '/modules/qmr.php';

require __DIR__ . '/modules/erp.php';

require __DIR__ . '/modules/work_order.php';

require __DIR__ . '/modules/car_usage.php';



require __DIR__ . '/settings.php';

require __DIR__ . '/auth.php';

// Reusable APIs via Web Session
require __DIR__ . '/modules/api_reusable.php';

// errors pages
Route::fallback(function () {
    return Inertia::render('Errors/404')->toResponse(request())->setStatusCode(404);
});
