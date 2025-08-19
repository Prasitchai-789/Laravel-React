<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ProjectController;



Route::prefix('projects')->group(function () {
    Route::get('/', [ProjectController::class, 'index']);       // ดึงทั้งหมด พร้อม pagination, filter, search
    Route::get('/{id}', [ProjectController::class, 'show']);   // ดึง Project ตาม ID
});
