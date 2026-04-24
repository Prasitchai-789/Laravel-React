<?php

use App\Http\Controllers\Api\PatrolLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'permission:developer.view|it.view'])->group(function () {
    Route::get('/it/patrol', function () {
        return Inertia::render('IT/PatrolLogs');
    })->name('it.patrol');

    Route::get('/it/patrol/scan', function () {
        return Inertia::render('IT/PatrolScan');
    })->name('it.patrol.scan');

    Route::get('/it/patrol/form', function () {
        return Inertia::render('IT/PatrolForm');
    })->name('it.patrol.form');

    Route::get('/it/patrol/qr-generator', function () {
        return Inertia::render('IT/PatrolQRGenerator');
    })->name('it.patrol.qr-generator');

    Route::get('/it/patrol/checkpoints', function () {
        return Inertia::render('IT/PatrolCheckpoints');
    })->name('it.patrol.checkpoints');

    Route::prefix('api/patrol')->group(function () {
        Route::get('/checkpoints', [PatrolLogController::class, 'checkpoints']);
        Route::get('/logs', [PatrolLogController::class, 'index']);
        Route::post('/scan', [PatrolLogController::class, 'store']);
        Route::get('/admin/checkpoints', [PatrolLogController::class, 'adminCheckpoints']);
        Route::post('/admin/checkpoints', [PatrolLogController::class, 'storeCheckpoint']);
        Route::put('/admin/checkpoints/{id}', [PatrolLogController::class, 'updateCheckpoint']);
        Route::delete('/admin/checkpoints/{id}', [PatrolLogController::class, 'destroyCheckpoint']);
    });
});
