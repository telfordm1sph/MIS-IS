<?php

use App\Http\Controllers\Api\IssuanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('issuance')->middleware('api.token')->group(function () {
    // Create
    Route::post('/create', [IssuanceController::class, 'createIssuance']);
    Route::post('/component/maintenance/batch', [IssuanceController::class, 'createComponentMaintenanceIssuance'])->name('component.maintenance.batch');

    // Table (unified — type 1 + type 2)
    Route::post('/table', [IssuanceController::class, 'getIssuanceTable']);

    // Acknowledgement
    Route::put('/acknowledge/{id}', [IssuanceController::class, 'acknowledgeIssuance'])->name('issuance.acknowledge');
});
