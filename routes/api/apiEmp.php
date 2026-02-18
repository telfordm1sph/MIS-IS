<?php


use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('emp')->middleware('api.token')->group(function () {
    Route::get('/emp-list', [UserController::class, 'getEmployees'])->name('employees.list');
});
