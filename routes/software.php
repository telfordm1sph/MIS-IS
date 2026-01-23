<?php

use App\Http\Controllers\SoftwareController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/software', [SoftwareController::class, 'getSoftwareTable'])->name('software.table');

        Route::post('software', [SoftwareController::class, 'store'])->name('software.store');
        Route::put('/software/{id}', [SoftwareController::class, 'update'])->name('software.update');
        Route::delete('/software/{id}', [SoftwareController::class, 'destroy'])->name('software.destroy');
    });
