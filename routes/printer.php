<?php

use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/printers', [PrinterController::class, 'getPrinterTable'])->name('printers.table');

        // Printer CRUD routes
        Route::post('/printers', [PrinterController::class, 'store'])->name('printers.store');
        Route::put('/printers/{id}', [PrinterController::class, 'update'])->name('printers.update');
        Route::delete('/printers/{id}', [PrinterController::class, 'destroy'])->name('printers.destroy');

        // Printer parts routes
        Route::get('/printers/{id}/parts', [PrinterController::class, 'getPrinterParts'])->name('printers.parts.list');

        // Printer logs
        Route::get('/printers/{id}/logs', [PrinterController::class, 'getLogs'])->name('printers.logs');
    });
