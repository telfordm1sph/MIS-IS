<?php


use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('dashboard')->middleware('api.token')->group(function () {

    Route::get('hardware/counts',     [DashboardController::class, 'hardwareCounts'])->name('dashboard.hardware.counts');
    Route::get('hardware/chart-data', [DashboardController::class, 'hardwareChartData'])->name('dashboard.hardware.chart-data');


    Route::get('parts/counts',     [DashboardController::class, 'partsCounts'])->name('dashboard.parts.counts');
    Route::get('parts/chart-data', [DashboardController::class, 'partsChartData'])->name('dashboard.parts.chart-data');
});
