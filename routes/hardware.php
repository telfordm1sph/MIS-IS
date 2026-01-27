<?php

use App\Http\Controllers\HardwareController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/hardware', [HardwareController::class, 'getHardwareTable'])->name('hardware.table');

        Route::get('/hardware/{id}/logs', [HardwareController::class, 'getLogs'])->name('hardware.logs');
    });
