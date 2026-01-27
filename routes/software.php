<?php

use App\Http\Controllers\LicensesController;
use App\Http\Controllers\SoftwareController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/software', [SoftwareController::class, 'getSoftwareTable'])->name('software.table');

        Route::post('software', [SoftwareController::class, 'store'])->name('software.store');
        Route::put('/software/{id}', [SoftwareController::class, 'update'])->name('software.update');
        Route::delete('/software/{id}', [SoftwareController::class, 'destroy'])->name('software.destroy');

        Route::get('/software/{id}/logs', [SoftwareController::class, 'getLogs'])->name('software.logs');

        Route::get('/licenses', [LicensesController::class, 'getLicensesTable'])->name('licenses.table');

        Route::post('licenses', [LicensesController::class, 'store'])->name('licenses.store');
        Route::put('/licenses/{id}', [LicensesController::class, 'update'])->name('licenses.update');
        Route::delete('/licenses/{id}', [LicensesController::class, 'destroy'])->name('licenses.destroy');

        Route::get('/licenses/{id}/logs', [LicensesController::class, 'getLogs'])->name('licenses.logs');
    });
