<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        $isInternal = in_array($request->ip(), ['192.168.2.110', '::1']);
//         dd($request->ip());
// dd($token, $isInternal);
        // ❌ If token exists but is wrong → reject
        if ($token && $token !== config('api.token')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // ✅ Internal request with no token → allow
        if ($isInternal) {
            return $next($request);
        }

        // 🔐 External request MUST have correct token
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        return $next($request);
    }
}
