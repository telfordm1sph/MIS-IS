<?php

use App\Http\Controllers\Api\HardwareApiController;
use App\Http\Controllers\Api\HardwareDetailController;
use App\Http\Controllers\HardwareController;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware')->middleware('api.token')->group(function () {
    Route::get('{hardwareId}/full-details', [HardwareDetailController::class, 'fullDetails'])
        ->name('hardware.full.details');
    Route::get('{hardwareId}/parts', [HardwareDetailController::class, 'parts'])->name('hardware.parts.list');
    Route::get('{hardwareId}/software', [HardwareDetailController::class, 'software'])->name('hardware.software.list');

    // Parts cascading options
    Route::get('parts-options/{filters?}', [HardwareDetailController::class, 'partsOptions'])
        ->name('hardware.parts.options');
    Route::get('parts-inventory/{filters?}', [HardwareDetailController::class, 'partsInventory'])
        ->name('hardware.parts.inventory');

    // Software cascading options
    Route::get('software-options/{filters?}', [HardwareDetailController::class, 'softwareOptions'])
        ->name('hardware.software.options');
    Route::get('software-licenses/{filters?}', [HardwareDetailController::class, 'softwareLicenses'])
        ->name('hardware.software.licenses');

    // Software inventory options for license management
    Route::get('software-inventory-options', [HardwareDetailController::class, 'softwareInventoryOptions'])
        ->name('software.inventory.options');

    Route::post('hardware/store', [HardwareController::class, 'store'])->name('hardware.store');
    Route::put('{hardwareId}/update', [HardwareController::class, 'update'])->name('hardware.update');
    Route::get('/hardwareApi', [HardwareApiController::class, 'index']);

    Route::post('replace-component', [HardwareController::class, 'replaceComponent'])
        ->name('hardware.replace.component');
    Route::post('add-component', [HardwareController::class, 'addComponent'])
        ->name('hardware.component.add');
    Route::post('remove-component', [HardwareController::class, 'removeComponent'])
        ->name('hardware.component.remove');



    Route::get('/parts/available', [HardwareDetailController::class, 'availableParts']);
    Route::get('/parts/all-available', [HardwareDetailController::class, 'allAvailableParts'])->name('inventory.parts.available');
    Route::get('/software/available', [HardwareDetailController::class, 'availableSoftware']);
    Route::get('/software/all-available', [HardwareDetailController::class, 'allAvailableSoftware'])->name('inventory.software.available');
});
