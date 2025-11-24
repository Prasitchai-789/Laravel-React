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



