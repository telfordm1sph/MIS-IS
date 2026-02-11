<?php

use App\Http\Controllers\Api\IssuanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('issuance')->middleware('api.token')->group(function () {
    // Whole unit 
    Route::post('/create', [IssuanceController::class, 'createIssuance']);

    // Individual item 
    Route::post('/items/create', [IssuanceController::class, 'createItemIssuance']);

    // Tables
    Route::get('/whole-unit/table', [IssuanceController::class, 'getWholeUnitIssuanceTable']);
    Route::get('/individual-items/table', [IssuanceController::class, 'getIndividualItemIssuanceTable']);

    // Acknowledgement Actions
    Route::get('/get-acknowledgements/{id}', [IssuanceController::class, 'getAcknowledgementDetails']);
    Route::put('/acknowledge/{id}', [IssuanceController::class, 'updateAcknowledgement']);
});
