<?php

use App\Http\Controllers\CCTVController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/cctv', [CCTVController::class, 'getCCTVTable'])->name('cctv.table');

        Route::get('/cctv/{id}/logs', [CCTVController::class, 'getLogs'])->name('cctv.logs');
    });
