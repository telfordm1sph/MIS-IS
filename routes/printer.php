<?php

use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/printers', [PrinterController::class, 'getPrinterTable'])->name('printers.table');

        Route::get('/printers/{id}/logs', [PrinterController::class, 'getLogs'])->name('printers.logs');
    });
