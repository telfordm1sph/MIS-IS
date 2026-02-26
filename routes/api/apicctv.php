<?php

use App\Http\Controllers\CCTVController;
use Illuminate\Support\Facades\Route;

Route::prefix('cctv')->middleware('api.token')->group(function () {
    Route::post('/', [CCTVController::class, 'store'])->name('cctv.store');
    Route::put('/{id}', [CCTVController::class, 'update'])->name('cctv.update');
    Route::delete('/{id}', [CCTVController::class, 'destroy'])->name('cctv.destroy');

    Route::get('/{id}/logs', [CCTVController::class, 'getLogs'])->name('cctv.logs');
});
