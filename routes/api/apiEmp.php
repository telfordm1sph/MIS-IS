<?php


use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('emp')->middleware('api.token')->group(function () {
    Route::get('/emp-list', [UserController::class, 'getEmployees'])->name('employees.list');
    Route::get('/dept-list', [UserController::class, 'getDepartments'])->name('departments.list');
    Route::get('/loc-list', [UserController::class, 'getLocationList'])->name('locations.list');
    Route::get('/prodline-list', [UserController::class, 'getProdlineOptions'])->name('prod-lines.list');
    Route::get('/station-list', [UserController::class, 'getStationOptions'])->name('stations.list');
});
