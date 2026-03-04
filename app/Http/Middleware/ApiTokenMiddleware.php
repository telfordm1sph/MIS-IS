<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        // Get the host the client is accessing (e.g., 192.168.2.221)
        $hostAccessed = $request->getHost();
        $serverHost = parse_url(config('app.url'), PHP_URL_HOST); // server host from APP_URL

        // ✅ Allow all requests coming through this system
        $isInternalSystem = $hostAccessed === $serverHost;

        // 🔐 External systems must provide correct token
        if (!$isInternalSystem) {
            if (!$token || $token !== config('api.token')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
        }

        return $next($request);
    }
}
