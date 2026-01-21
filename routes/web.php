<?php

use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$app_name = env('APP_NAME', '');

//Api routes
require __DIR__ . '/api.php';
// Authentication routes
require __DIR__ . '/auth.php';

// General routes
require __DIR__ . '/general.php';

// Hardware
require __DIR__ . '/hardware.php';
Route::get("/demo", [DemoController::class, 'index'])->name('demo');

Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
