<?php

use App\Http\Controllers\Memo\MemoExpenseDocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:users.view'])->prefix('memo')->group(function () {
    Route::get('/documents', [MemoExpenseDocumentController::class, 'index'])->name('memo.documents.index');
    Route::get('/categories', [MemoExpenseDocumentController::class, 'create'])->name('memo.categories.create');
    Route::get('/documents/api', [MemoExpenseDocumentController::class, 'apiIndex'])->name('memo.documents.api');
    Route::get('/documents/show/{ref_id}', [MemoExpenseDocumentController::class, 'show'])->name('memo.documents.show');
    Route::post('/documents', [MemoExpenseDocumentController::class, 'store'])->name('memo.documents.store');
    Route::put('/documents/{document}', [MemoExpenseDocumentController::class, 'update'])->name('memo.documents.update');
    Route::delete('/documents/{document}', [MemoExpenseDocumentController::class, 'destroy'])->name('memo.documents.destroy');
});
