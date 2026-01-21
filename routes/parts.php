<?php

use App\Http\Controllers\PartsController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/parts', [PartsController::class, 'getPartsTable'])->name('parts.table');
    });
