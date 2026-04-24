<?php

use App\Http\Controllers\Api\MonitoringController;
use App\Models\ChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->prefix('monitoring')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Monitoring/DashboardOverview');
    })->name('monitoring.dashboard');

    Route::get('/devices', function () {
        return Inertia::render('Monitoring/DeviceList');
    })->name('monitoring.devices');

    Route::get('/devices/{id}', function ($id) {
        return Inertia::render('Monitoring/DeviceDetail', ['deviceId' => $id]);
    })->name('monitoring.device.detail');

    Route::get('/map', function () {
        return Inertia::render('Monitoring/MapPage');
    })->name('monitoring.map');

    Route::get('/checklist', function (Request $request) {
        return Inertia::render('Monitoring/ChecklistPage', [
            'deviceId' => $request->deviceId,
            'deviceName' => $request->deviceName,
            'items' => ChecklistItem::where('checklist_id', $request->checklistId)->get(),
        ]);
    })->name('monitoring.checklist');
});

Route::middleware(['auth'])->prefix('api/monitoring')->group(function () {
    Route::get('/dashboard/overview', [MonitoringController::class, 'getOverview']);
    Route::get('/dashboard/map', [MonitoringController::class, 'getMapData']);
    Route::get('/devices', [MonitoringController::class, 'getDevices']);
    Route::get('/devices/{id}', [MonitoringController::class, 'getDeviceDetail']);
    Route::post('/checklist/submit', [MonitoringController::class, 'submitChecklist']);
    Route::get('/dashboard/status', [MonitoringController::class, 'getStatus']);
    Route::post('/dashboard/toggle', [MonitoringController::class, 'toggleStatus']);
});
