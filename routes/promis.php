<?php

use App\Http\Controllers\PromisController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/promis', [PromisController::class, 'getPromisTable'])->name('promis.table');
    });
