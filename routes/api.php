<?php

use App\Http\Controllers\Api\HardwareDetailController;
use Illuminate\Support\Facades\Route;

Route::prefix('hardware')->group(function () {
    Route::get('{hardwareId}/parts', [HardwareDetailController::class, 'parts'])->name('hardware.parts.list');
    Route::get('{hardwareId}/software', [HardwareDetailController::class, 'software'])->name('hardware.software.list');
});
