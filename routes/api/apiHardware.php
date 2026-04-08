<?php

use App\Http\Controllers\Api\HardwareApiController;
use App\Http\Controllers\Api\HardwareDetailController;
use App\Http\Controllers\HardwareController;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware')->middleware('api.token')->group(function () {

    // GET routes (read-only, higher limit)
    Route::get('hostnames', [HardwareDetailController::class, 'getHostNames'])
        ->middleware('throttle:high')
        ->name('hostnames.list');

    Route::get('hostnames-or-serials/{type_of_request}', [HardwareDetailController::class, 'getHostNamesOrSerial'])
        ->middleware('throttle:high')
        ->name('hostnames.or.serials.list');

    Route::get('{hardwareId}/full-details', [HardwareDetailController::class, 'fullDetails'])
        ->middleware('throttle:high')
        ->name('hardware.full.details');

    Route::get('{hardwareId}/parts', [HardwareDetailController::class, 'parts'])
        ->middleware('throttle:high')
        ->name('hardware.parts.list');

    Route::get('{hardwareId}/software', [HardwareDetailController::class, 'software'])
        ->middleware('throttle:high')
        ->name('hardware.software.list');

    Route::get('parts-options/{filters?}', [HardwareDetailController::class, 'partsOptions'])
        ->middleware('throttle:high')
        ->name('hardware.parts.options');

    Route::get('parts-inventory/{filters?}', [HardwareDetailController::class, 'partsInventory'])
        ->middleware('throttle:high')
        ->name('hardware.parts.inventory');

    Route::get('software-options/{filters?}', [HardwareDetailController::class, 'softwareOptions'])
        ->middleware('throttle:high')
        ->name('hardware.software.options');

    Route::get('software-licenses/{filters?}', [HardwareDetailController::class, 'softwareLicenses'])
        ->middleware('throttle:high')
        ->name('hardware.software.licenses');

    Route::get('software-inventory-options', [HardwareDetailController::class, 'softwareInventoryOptions'])
        ->middleware('throttle:high')
        ->name('software.inventory.options');

    Route::get('/{id}/logs', [HardwareController::class, 'getLogs'])
        ->middleware('throttle:50,1')
        ->name('hardware.logs');

    Route::get('/parts/available', [HardwareDetailController::class, 'availableParts'])
        ->middleware('throttle:high');

    Route::get('/parts/all-available', [HardwareDetailController::class, 'allAvailableParts'])
        ->middleware('throttle:high')
        ->name('inventory.parts.available');

    Route::get('/software/available', [HardwareDetailController::class, 'availableSoftware'])
        ->middleware('throttle:high');

    Route::get('/software/all-available', [HardwareDetailController::class, 'allAvailableSoftware'])
        ->middleware('throttle:high')
        ->name('inventory.software.available');

    Route::get('/hardwareApi', [HardwareApiController::class, 'index'])
        ->middleware('throttle:high');

    // POST/PUT routes (write operations, lower limit)
    Route::post('hardware/store', [HardwareController::class, 'store'])
        ->middleware('throttle:high')
        ->name('hardware.store');

    Route::put('{hardwareId}/update', [HardwareController::class, 'update'])
        ->middleware('throttle:high')
        ->name('hardware.update');

    Route::post('replace-component', [HardwareController::class, 'replaceComponent'])
        ->middleware('throttle:high')
        ->name('hardware.replace.component');

    Route::post('add-component', [HardwareController::class, 'addComponent'])
        ->middleware('throttle:high')
        ->name('hardware.component.add');

    Route::post('remove-component', [HardwareController::class, 'removeComponent'])
        ->middleware('throttle:high')
        ->name('hardware.component.remove');
});
