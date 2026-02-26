<?php

use App\Http\Controllers\PromisController;
use Illuminate\Support\Facades\Route;

Route::prefix('promis')->middleware('api.token')->group(function () {
    Route::post('', [PromisController::class, 'store'])->name('promis.store');
    Route::put('/{id}', [PromisController::class, 'update'])->name('promis.update');
    Route::delete('/{id}', [PromisController::class, 'destroy'])->name('promis.destroy');
    Route::get('/{id}/logs', [PromisController::class, 'getLogs'])->name('promis.logs');
});
