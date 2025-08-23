<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ChemicalController;
use App\Http\Controllers\MilestoneController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');


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

// web.php
Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
Route::get('/projects/{id}', [ProjectController::class, 'projectDetail'])->name('projects.projectDetail');


Route::prefix('projects/{project}')->group(function () {
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::post('/milestones', [MilestoneController::class, 'store'])->name('milestones.store');
    Route::put('/milestones/{milestone}', [MilestoneController::class, 'update'])->name('milestones.update');
});


// Routes สำหรับดูรายการ Chemical (index, show) - รวม permission
Route::middleware(['permission:users.view|users.create|users.edit|users.delete'])->group(function () {
    Route::get('chemical', [ChemicalController::class, 'index'])->name('chemical.index');
    Route::get('chemical/{chemical}', [ChemicalController::class, 'show'])->name('chemical.show');
});

// Routes สำหรับสร้าง Chemical - permission: create
Route::middleware('permission:users.create')->group(function () {
    Route::get('chemical/create', [ChemicalController::class, 'create'])->name('chemical.create');
    Route::post('chemical', [ChemicalController::class, 'store'])->name('chemical.store');
});

// Routes สำหรับแก้ไข Chemical - permission: edit
Route::middleware('permission:users.edit')->group(function () {
    Route::get('chemical/{chemical}/edit', [ChemicalController::class, 'edit'])->name('chemical.edit');
    Route::put('chemical/{chemical}', [ChemicalController::class, 'update'])->name('chemical.update');
});

// Routes สำหรับลบ Chemical - permission: delete
Route::middleware('permission:users.delete')->group(function () {
    Route::delete('chemical/{chemical}', [ChemicalController::class, 'destroy'])->name('chemical.destroy');
    // ใช้ method POST สำหรับการลบหลายรายการ
    Route::post('/chemical/delete', [ChemicalController::class, 'destroy'])->name('chemical.delete');

    // หรือใช้ method DELETE แบบดั้งเดิมแต่ส่ง array ของ IDs
    Route::delete('/chemical', [ChemicalController::class, 'destroy'])->name('chemical.destroy');
});

Route::get('/monthly', [ChemicalController::class, 'monthly'])
    ->name('chemicals.monthly');

Route::get('/monthly/export-excel', [ChemicalController::class, 'exportExcel'])->name('monthly.exportExcel');
Route::get('/monthly/export-pdf', [ChemicalController::class, 'exportPdf'])->name('monthly.exportPdf');



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
