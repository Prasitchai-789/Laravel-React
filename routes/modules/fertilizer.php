<?php

use App\Http\Controllers\MUN\FertilizerProductionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('fertilizer')->group(function () {
    Route::get('/productions', [FertilizerProductionController::class, 'index'])->name('fertilizer.productions.index');
    Route::get('/productions/api', [FertilizerProductionController::class, 'apiIndex'])->name('fertilizer.productions.api');
    Route::post('/productions', [FertilizerProductionController::class, 'store'])->name('fertilizer.productions.store');
    Route::put('/productions/{fertilizerProduction}', [FertilizerProductionController::class, 'update'])->name('fertilizer.productions.update');
    Route::delete('/productions/{fertilizerProduction}', [FertilizerProductionController::class, 'destroy'])->name('fertilizer.productions.destroy');
});
