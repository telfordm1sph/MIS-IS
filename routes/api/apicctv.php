<?php

use App\Http\Controllers\CCTVController;
use Illuminate\Support\Facades\Route;

Route::prefix('cctv')->middleware('api.token')->group(function () {
    Route::post('/cctv', [CCTVController::class, 'store'])->name('cctv.store');
    Route::put('/cctv/{id}', [CCTVController::class, 'update'])->name('cctv.update');
    Route::delete('/cctv/{id}', [CCTVController::class, 'destroy'])->name('cctv.destroy');
});
