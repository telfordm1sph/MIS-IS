<?php

use App\Http\Controllers\Api\IssuanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('issuance')->middleware(['api.token'])->group(function () {

    // STRICT (was 10/min)
    Route::post('/create', [IssuanceController::class, 'createIssuance'])
        ->middleware('throttle:very-low');

    Route::post('/component/maintenance/batch', [IssuanceController::class, 'createComponentMaintenanceIssuance'])
        ->middleware('throttle:very-low')
        ->name('component.maintenance.batch');

    // MEDIUM (was 60/min)
    Route::post('/table', [IssuanceController::class, 'getIssuanceTable'])
        ->middleware('throttle:medium');

    // LOW/MEDIUM (was 30/min → closest is low or medium)
    Route::put('/acknowledge/{id}', [IssuanceController::class, 'acknowledgeIssuance'])
        ->middleware('throttle:low')
        ->name('issuance.acknowledge');
});
