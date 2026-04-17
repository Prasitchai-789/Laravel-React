<?php

use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SaleMARController;
use App\Http\Controllers\Store\StoreMovementController;
use App\Http\Controllers\Api\PurchaseDashboardController;


Route::prefix('projects')->group(function () {
    Route::get('/', [ProjectController::class, 'index']);       // ดึงทั้งหมด พร้อม pagination, filter, search
    Route::get('/{id}', [ProjectController::class, 'show']);   // ดึง Project ตาม ID
});



// Route::middleware(['auth', ''])->group(function () {
    // Route::apiResource('purchase/dashboard', PurchaseDashboardController::class)->only(['index']);
// });
Route::post('/citizens/clear', function () {
    Citizen::truncate();
    return response()->json(['message' => 'ลบข้อมูลทั้งหมดเรียบร้อย']);
});



use App\Http\Controllers\Api\MonitoringController;

Route::prefix('monitoring')->group(function () {
    Route::post('/agent/report', [MonitoringController::class, 'reportMetrics']);
    Route::get('/dashboard/overview', [MonitoringController::class, 'getOverview']);
    Route::get('/dashboard/map', [MonitoringController::class, 'getMapData']);
    Route::get('/devices', [MonitoringController::class, 'getDevices']);
    Route::get('/devices/{id}', [MonitoringController::class, 'getDeviceDetail']);
    Route::post('/checklist/submit', [MonitoringController::class, 'submitChecklist']);
    Route::get('/dashboard/status', [MonitoringController::class, 'getStatus']);
    Route::post('/dashboard/toggle', [MonitoringController::class, 'toggleStatus']);
});

use App\Http\Controllers\Dashboard\ProductionDashboardController;
use App\Http\Controllers\Api\Dashboard\CycleTimeController;
use App\Http\Controllers\Api\Dashboard\PalmAnalyticsController;

Route::get('/dashboard/production', [ProductionDashboardController::class, 'apiData']);
Route::get('/dashboard/cycle-time', [CycleTimeController::class, 'index']);
Route::get('/dashboard/palm-analytics', [PalmAnalyticsController::class, 'intake']);

Route::get('/delivery-plan/lookups', [\App\Http\Controllers\MAR\DeliveryPlanController::class, 'lookups']);
Route::get('/delivery-plan/{date}', [\App\Http\Controllers\MAR\DeliveryPlanController::class, 'index']);
Route::post('/delivery-plan/order', [\App\Http\Controllers\MAR\DeliveryPlanController::class, 'storeOrder']);
Route::post('/delivery-plan/order/complete', [\App\Http\Controllers\MAR\DeliveryPlanController::class, 'completeOrder']);
Route::post('/delivery-plan/update', [\App\Http\Controllers\MAR\DeliveryPlanController::class, 'update']);
