<?php

use App\Http\Controllers\Api\HardwareDetailController;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware')->group(function () {
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
});
