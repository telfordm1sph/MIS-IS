<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Get employee ID from either session (web) or request (API)
     * HELPER: Works for both internal and external requests
     * 
     * Priority order:
     * 1. Session (for web/internal users)
     * 2. Request body (for API calls)
     * 3. Request header (alternative API method)
     */
    protected function getEmployeeId(Request $request): ?int
    {
        // Priority 1: Try to get from session (for web/internal users)
        $empData = session('emp_data');

        if ($empData && isset($empData['emp_id'])) {
            return (int) $empData['emp_id'];
        }

        // Priority 2: Try to get from request body (for API calls)
        if ($request->has('employee_id')) {
            return (int) $request->input('employee_id');
        }

        // Priority 3: Try to get from custom header (alternative API method)
        if ($request->hasHeader('X-Employee-ID')) {
            return (int) $request->header('X-Employee-ID');
        }

        // No employee ID found
        return null;
    }

    /**
     * Get full employee data from session
     */
    protected function getEmployeeData(): ?array
    {
        return session('emp_data');
    }

    /**
     * Decode base64 filters
     * REQUEST LAYER: Helper method
     */

    protected function decodeFilters(?string $encoded): array
    {
        if (!$encoded) {
            return [];
        }

        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
