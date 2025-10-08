<?php

use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CitizenController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\PurchaseDashboardController;
use App\Http\Controllers\Store\StoreMovementController;


Route::prefix('projects')->group(function () {
    Route::get('/', [ProjectController::class, 'index']);       // ดึงทั้งหมด พร้อม pagination, filter, search
    Route::get('/{id}', [ProjectController::class, 'show']);   // ดึง Project ตาม ID
});




Route::post('/upload-citizens', [CitizenController::class, 'upload']);

// Route::post('/citizens/bulk', [CitizenController::class, 'bulkUpload']);
Route::get('/community', [CitizenController::class, 'community']);
Route::get('/get-locations', [CitizenController::class, 'getLocations']);
Route::get('/get-villages', [CitizenController::class, 'getVillages']);
Route::post('/citizens/bulk', [CitizenController::class, 'bulkUpload']);


// Route::middleware(['auth', ''])->group(function () {
    // Route::apiResource('purchase/dashboard', PurchaseDashboardController::class)->only(['index']);
// });






Route::post('/citizens/clear', function () {
    Citizen::truncate();
    return response()->json(['message' => 'ลบข้อมูลทั้งหมดเรียบร้อย']);
});
