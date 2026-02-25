<?php

use App\Http\Controllers\PromisController;
use Illuminate\Support\Facades\Route;

Route::prefix('promis')->middleware('api.token')->group(function () {
    Route::post('/promis', [PromisController::class, 'store'])->name('promis.store');
    Route::put('/promis/{id}', [PromisController::class, 'update'])->name('promis.update');
    Route::delete('/promis/{id}', [PromisController::class, 'destroy'])->name('promis.destroy');
});
