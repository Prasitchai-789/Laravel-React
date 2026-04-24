<?php

use App\Http\Controllers\Computer\ComputerChecklistController;
use App\Http\Controllers\Computer\ComputerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:developer.view|it.view'])->group(function () {
    Route::get('/computer-checklists', [ComputerChecklistController::class, 'index'])->name('computer-checklists.index');
    Route::get('/computer-checklists/api', [ComputerChecklistController::class, 'apiIndex']);
    Route::post('/computer-checklists', [ComputerChecklistController::class, 'store']);
    Route::put('/computer-checklists/{id}', [ComputerChecklistController::class, 'update']);
    Route::delete('/computer-checklists/{id}', [ComputerChecklistController::class, 'destroy']);
    Route::post('/computer-checklists/reorder', [ComputerChecklistController::class, 'reorder']);

    Route::get('/computer-inspection', [ComputerController::class, 'index'])->name('computer.index');
    Route::get('/computer-inspection/plan', [ComputerController::class, 'plan'])->name('computer.plan');
    Route::get('/computer-inspection/form/{id}', [ComputerController::class, 'form'])->name('computer.form');
    Route::get('/computer-inspection/api', [ComputerController::class, 'apiData'])->name('computer.api');
    Route::get('/computer-inspection/api/plan', [ComputerController::class, 'apiPlan'])->name('computer.api.plan');
    Route::post('/computer-inspection/api/toggle-plan', [ComputerController::class, 'togglePlan'])->name('computer.api.toggle-plan');
    Route::get('/computer-inspection/api/{id}', [ComputerController::class, 'show'])->name('computer.show');
    Route::post('/computer-inspection', [ComputerController::class, 'store'])->name('computer.store');
    Route::get('/computer-inspection/report/{id}', [ComputerController::class, 'report'])->name('computer.report');
});
