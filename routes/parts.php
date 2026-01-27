<?php

use App\Http\Controllers\PartsController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/parts', [PartsController::class, 'getPartsTable'])->name('parts.table');

        Route::post('parts', [PartsController::class, 'store'])->name('parts.store');
        Route::put('/parts/{id}', [PartsController::class, 'update'])->name('parts.update');
        Route::delete('/parts/{id}', [PartsController::class, 'destroy'])->name('parts.destroy');

        Route::get('/parts/{id}/logs', [PartsController::class, 'getLogs'])->name('parts.logs');
    });
