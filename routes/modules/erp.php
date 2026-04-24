<?php

use App\Http\Controllers\ERP\ERPController;
use App\Http\Controllers\ERP\ShiftController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:ERP.view'])->group(function () {
    Route::get('/ERPIndex', [ERPController::class, 'index']);
    Route::get('/ERPDashboard', [ERPController::class, 'Dashboard']);
    Route::get('/ERPDetail', [ERPController::class, 'Detail']);
    Route::get('/ImportExcel', [ERPController::class, 'ImportExcel']);
    Route::get('/shifts', [ERPController::class, 'shifts']);
    Route::get('/overtime', [ERPController::class, 'overtime']);
    Route::get('/erp', [ERPController::class, 'index'])->name('erp.index');

    Route::post('/shifts', [ShiftController::class, 'store'])->name('shifts.store');
    Route::put('/shifts/{id}', [ShiftController::class, 'update'])->name('shifts.update');
    Route::delete('/shifts/{id}', [ShiftController::class, 'destroy'])->name('shifts.destroy');
});
