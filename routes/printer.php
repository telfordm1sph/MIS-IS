<?php

use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/printers', [PrinterController::class, 'getPrinterTable'])->name('printers.table');
    });
