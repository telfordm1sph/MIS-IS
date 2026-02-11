<?php

use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$app_name = env('APP_NAME', '');

require __DIR__ . '/api/apiHardware.php';
require __DIR__ . '/api/apiPrinter.php';
require __DIR__ . '/api/apicctv.php';
require __DIR__ . '/api/apiIssuance.php';



Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
