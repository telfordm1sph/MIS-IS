<?php

use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

Route::prefix('printer')->middleware('api.token')->group(function () {
    Route::post('', [PrinterController::class, 'store'])->name('printers.store');
    Route::put('/{id}', [PrinterController::class, 'update'])->name('printers.update');
    Route::delete('/{id}', [PrinterController::class, 'destroy'])->name('printers.destroy');
    Route::get('/{id}/logs', [PrinterController::class, 'getLogs'])->name('printers.logs');
});
