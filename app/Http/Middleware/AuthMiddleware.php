<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;


class AuthMiddleware
{


    public function handle(Request $request, Closure $next)
    {
        // 🔹 Get token from query, session, or cookie
        $tokenFromQuery   = $request->query('key');
        $tokenFromSession = session('emp_data.token');
        $tokenFromCookie  = $request->cookie('sso_token');
        $token = $tokenFromQuery ?? $tokenFromSession ?? $tokenFromCookie;

        Log::info('AuthMiddleware token check', [
            'query'   => $tokenFromQuery,
            'cookie'  => $tokenFromCookie,
            'session' => $tokenFromSession,
            'used'    => $token,
        ]);

        // 🔹 No token → redirect to login
        if (!$token) {
            return $this->redirectToLogin($request);
        }

        // 🔹 Session exists & token matches → continue
        if (session()->has('emp_data') && session('emp_data.token') === $token) {
            $cookie = cookie('sso_token', $token, 60 * 24 * 7, '/', null, false, true);

            // Remove ?key from URL if present (only once)
            if ($tokenFromQuery) {
                $url = $request->url();
                $query = $request->query();
                unset($query['key']);
                if (!empty($query)) {
                    $url .= '?' . http_build_query($query);
                }
                return redirect($url)->withCookie($cookie);
            }

            return $next($request)->withCookie($cookie);
        }

        // 🔹 Fetch user from authify if session missing or token mismatch
        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

        if (!$currentUser) {
            session()->forget('emp_data');
            setcookie('sso_token', '', time() - 3600, '/');
            return $this->redirectToLogin($request);
        }

        // 🔹 Get user roles (now returns array)
        $userId = $currentUser->emp_id;
        // $userRoles = $this->userRoleService->getRole($userId);

        Log::info('User roles fetched', [
            'emp_id' => $userId,
            // 'roles' => $userRoles,
        ]);

        // 🔹 Set session with roles array
        session(['emp_data' => [
            'token'          => $currentUser->token,
            'emp_id'         => $currentUser->emp_id,
            'emp_name'       => $currentUser->emp_name,
            'emp_firstname'  => $currentUser->emp_firstname,
            'emp_jobtitle'   => $currentUser->emp_jobtitle,
            'emp_dept'       => $currentUser->emp_dept,
            'emp_prodline'   => $currentUser->emp_prodline,
            'emp_station'    => $currentUser->emp_station,
            'emp_position'   => $currentUser->emp_position,
            // 'emp_user_roles' => $userRoles,
            'generated_at'   => $currentUser->generated_at,
        ]]);

        session()->save(); // force immediate save

        // 🔹 Set user resolver
        $request->setUserResolver(fn() => (object) session('emp_data'));

        // 🔹 Set cookie for 7 days
        $cookie = cookie('sso_token', $currentUser->token, 60 * 24 * 7, '/', null, false, true);

        // 🔹 Redirect once if token came from query
        if ($tokenFromQuery) {
            $url = $request->url();
            $query = $request->query();
            unset($query['key']);
            if (!empty($query)) {
                $url .= '?' . http_build_query($query);
            }
            return redirect($url)->withCookie($cookie);
        }

        // 🔹 Continue request with cookie
        return $next($request)->withCookie($cookie);
    }

    private function redirectToLogin(Request $request)
    {
        $redirectUrl = urlencode($request->fullUrl());
        return redirect("http://192.168.1.27:8080/authify/public/login?redirect={$redirectUrl}");
    }
}
