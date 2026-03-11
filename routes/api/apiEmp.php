<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('emp')->middleware('api.token')->group(function () {

    Route::get('/emp-list', [UserController::class, 'getEmployees'])
        ->middleware('throttle:100,1')
        ->name('employees.list');

    Route::get('/dept-list', [UserController::class, 'getDepartments'])
        ->middleware('throttle:100,1')
        ->name('departments.list');

    Route::get('/loc-list', [UserController::class, 'getLocationList'])
        ->middleware('throttle:100,1')
        ->name('locations.list');

    Route::get('/prodline-list', [UserController::class, 'getProdlineOptions'])
        ->middleware('throttle:100,1')
        ->name('prod-lines.list');

    Route::get('/station-list', [UserController::class, 'getStationOptions'])
        ->middleware('throttle:100,1')
        ->name('stations.list');
});
