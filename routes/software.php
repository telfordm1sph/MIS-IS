<?php

use App\Http\Controllers\SoftwareController;
use Illuminate\Support\Facades\Route;

$app_name = $app_name ?? env('APP_NAME', 'app');

Route::prefix($app_name)
    ->group(function () {

        Route::get('/software', [SoftwareController::class, 'getSoftwareTable'])->name('software.table');
    });
