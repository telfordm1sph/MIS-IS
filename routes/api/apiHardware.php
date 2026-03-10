<?php

use App\Http\Controllers\Api\HardwareApiController;
use App\Http\Controllers\Api\HardwareDetailController;
use App\Http\Controllers\HardwareController;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware')->middleware('api.token')->group(function () {

    // GET routes (read-only, higher limit)
    Route::get('hostnames', [HardwareDetailController::class, 'getHostNames'])
        ->middleware('throttle:100,1') // 100 requests per minute
        ->name('hostnames.list');

    Route::get('hostnames-or-serials/{type_of_request}', [HardwareDetailController::class, 'getHostNamesOrSerial'])
        ->middleware('throttle:100,1')
        ->name('hostnames.or.serials.list');

    Route::get('{hardwareId}/full-details', [HardwareDetailController::class, 'fullDetails'])
        ->middleware('throttle:100,1')
        ->name('hardware.full.details');

    Route::get('{hardwareId}/parts', [HardwareDetailController::class, 'parts'])
        ->middleware('throttle:100,1')
        ->name('hardware.parts.list');

    Route::get('{hardwareId}/software', [HardwareDetailController::class, 'software'])
        ->middleware('throttle:100,1')
        ->name('hardware.software.list');

    Route::get('parts-options/{filters?}', [HardwareDetailController::class, 'partsOptions'])
        ->middleware('throttle:100,1')
        ->name('hardware.parts.options');

    Route::get('parts-inventory/{filters?}', [HardwareDetailController::class, 'partsInventory'])
        ->middleware('throttle:60,1')
        ->name('hardware.parts.inventory');

    Route::get('software-options/{filters?}', [HardwareDetailController::class, 'softwareOptions'])
        ->middleware('throttle:60,1')
        ->name('hardware.software.options');

    Route::get('software-licenses/{filters?}', [HardwareDetailController::class, 'softwareLicenses'])
        ->middleware('throttle:60,1')
        ->name('hardware.software.licenses');

    Route::get('software-inventory-options', [HardwareDetailController::class, 'softwareInventoryOptions'])
        ->middleware('throttle:100,1')
        ->name('software.inventory.options');

    Route::get('/{id}/logs', [HardwareController::class, 'getLogs'])
        ->middleware('throttle:50,1')
        ->name('hardware.logs');

    Route::get('/parts/available', [HardwareDetailController::class, 'availableParts'])
        ->middleware('throttle:60,1');

    Route::get('/parts/all-available', [HardwareDetailController::class, 'allAvailableParts'])
        ->middleware('throttle:60,1')
        ->name('inventory.parts.available');

    Route::get('/software/available', [HardwareDetailController::class, 'availableSoftware'])
        ->middleware('throttle:60,1');

    Route::get('/software/all-available', [HardwareDetailController::class, 'allAvailableSoftware'])
        ->middleware('throttle:60,1')
        ->name('inventory.software.available');

    Route::get('/hardwareApi', [HardwareApiController::class, 'index'])
        ->middleware('throttle:60,1');

    // POST/PUT routes (write operations, lower limit)
    Route::post('hardware/store', [HardwareController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('hardware.store');

    Route::put('{hardwareId}/update', [HardwareController::class, 'update'])
        ->middleware('throttle:20,1')
        ->name('hardware.update');

    Route::post('replace-component', [HardwareController::class, 'replaceComponent'])
        ->middleware('throttle:15,1')
        ->name('hardware.replace.component');

    Route::post('add-component', [HardwareController::class, 'addComponent'])
        ->middleware('throttle:15,1')
        ->name('hardware.component.add');

    Route::post('remove-component', [HardwareController::class, 'removeComponent'])
        ->middleware('throttle:15,1')
        ->name('hardware.component.remove');
});
