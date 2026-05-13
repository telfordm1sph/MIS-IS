<?php

use App\Http\Controllers\LocationsController;
use Illuminate\Support\Facades\Route;

Route::prefix('locations')->middleware('api.token')->group(function () {

    // GET routes (read-only operations)
    Route::get('/', [LocationsController::class, 'index'])
        ->middleware('throttle:high')
        ->name('locations.index');

    Route::get('/paginate', [LocationsController::class, 'paginate'])
        ->middleware('throttle:high')
        ->name('locations.paginate');

    Route::get('/search', [LocationsController::class, 'search'])
        ->middleware('throttle:high')
        ->name('locations.search');

    Route::get('/{id}', [LocationsController::class, 'show'])
        ->middleware('throttle:high')
        ->name('locations.show');

    // POST/PUT/DELETE routes (write operations)
    Route::post('/', [LocationsController::class, 'store'])
        ->middleware('throttle:medium')
        ->name('locations.store');

    Route::put('/{id}', [LocationsController::class, 'update'])
        ->middleware('throttle:medium')
        ->name('locations.update');

    Route::delete('/{id}', [LocationsController::class, 'destroy'])
        ->middleware('throttle:medium')
        ->name('locations.destroy');
});