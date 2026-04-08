<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
public function boot()
{
    RateLimiter::for('high', function (Request $request) {
        return Limit::perMinute(100)
            ->by($request->user()?->id ?: $request->ip())
            ->response(function () {
                return response()->json([
                    'status' => false,
                    'message' => 'Too many requests. Please try again after a minute.'
                ], 429);
            });
    });

    RateLimiter::for('medium', function (Request $request) {
        return Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip())
            ->response(function () {
                return response()->json([
                    'status' => false,
                    'message' => 'You are sending requests too fast. Slow down.'
                ], 429);
            });
    });

    RateLimiter::for('low', function (Request $request) {
        return Limit::perMinute(20)
            ->by($request->user()?->id ?: $request->ip())
            ->response(function () {
                return response()->json([
                    'status' => false,
                    'message' => 'Too many actions. Please wait before trying again.'
                ], 429);
            });
    });

    RateLimiter::for('very-low', function (Request $request) {
        return Limit::perMinute(15)
            ->by($request->user()?->id ?: $request->ip())
            ->response(function () {
                return response()->json([
                    'status' => false,
                    'message' => 'Action limit reached. Try again later.'
                ], 429);
            });
    });
}
}
