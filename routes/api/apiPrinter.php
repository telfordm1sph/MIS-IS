<?php

use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

Route::prefix('printer')->middleware('api.token')->group(function () {
    Route::post('/printers', [PrinterController::class, 'store'])->name('printers.store');
    Route::put('/printers/{id}', [PrinterController::class, 'update'])->name('printers.update');
    Route::delete('/printers/{id}', [PrinterController::class, 'destroy'])->name('printers.destroy');
});
