<?php

use App\Http\Controllers\Api\IssuanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('issuance')->middleware(['api.token'])->group(function () {

    Route::post('/create', [IssuanceController::class, 'createIssuance'])
        ->middleware('throttle:10,1');

    Route::post('/component/maintenance/batch', [IssuanceController::class, 'createComponentMaintenanceIssuance'])
        ->middleware('throttle:10,1')
        ->name('component.maintenance.batch');

    Route::post('/table', [IssuanceController::class, 'getIssuanceTable'])
        ->middleware('throttle:60,1');

    Route::put('/acknowledge/{id}', [IssuanceController::class, 'acknowledgeIssuance'])
        ->middleware('throttle:30,1')
        ->name('issuance.acknowledge');
});
