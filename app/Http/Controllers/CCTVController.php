<?php

namespace App\Http\Controllers;

use App\Services\CCTVService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CCTVController extends Controller
{
    protected CCTVService $cctvService;

    public function __construct(CCTVService $cctvService)
    {
        $this->cctvService = $cctvService;
    }


    public function getCCTVTable(Request $request)
    {
        // Decode base64 filters
        $filters = $this->decodeFilters($request->input('f', ''));

        // Validate and set defaults
        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
        ];

        // BUSINESS LOGIC: Delegate to service
        $result = $this->cctvService->getCCTVTable($filters);

        // Check if request wants JSON (API call) or Inertia (web)
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'pagination' => $result['pagination'],
                'filters' => $result['filters'],
            ]);
        }

        // Return Inertia view for web interface
        return Inertia::render('Inventory/CCTVTable', [
            'cctvs' => $result['data'],
            'pagination' => $result['pagination'],
            'filters' => $result['filters'],
        ]);
    }


    public function getLogs(Request $request, $printerId)
    {
        try {
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);

            // BUSINESS LOGIC: Delegate to service
            $logs = $this->cctvService->getCCTVLogs($printerId, $page, $perPage);

            return response()->json($logs);
        } catch (\Exception $e) {
            Log::error('Failed to fetch cctv logs', [
                'cctv_id' => $printerId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch logs',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new printer
     * REQUEST: Handle HTTP request, validate input
     * WORKS FOR: Both session-based (web) and API requests
     */
    public function store(Request $request)
    {
        try {
            // Get employee ID from either session or request
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required. Please provide employee_id in request body or X-Employee-ID header.',
                ], 401);
            }

            // Validate the request
            $validated = $this->validateCCTVCreate($request);

            // BUSINESS LOGIC: Delegate to service
            $cctv = $this->cctvService->create($validated, $employeeId);

            return response()->json([
                'success' => true,
                'message' => 'CCTV created successfully',
                'id' => $cctv->id,
                'data' => $cctv
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('CCTV creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create printer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update printer
     * REQUEST: Handle HTTP request, validate input
     * WORKS FOR: Both session-based (web) and API requests
     */
    public function update(Request $request, $id)
    {
        try {
            // Get employee ID from either session or request
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required. Please provide employee_id in request body or X-Employee-ID header.',
                ], 401);
            }

            // Validate the request
            $validated = $this->validateCCTVUpdate($request);

            // BUSINESS LOGIC: Delegate to service
            $cctv = $this->cctvService->update($id, $validated, $employeeId);

            if (!$cctv) {
                return response()->json([
                    'success' => false,
                    'message' => 'Printer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Printer updated successfully',
                'data' => $cctv
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Printer update failed', [
                'printer_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update printer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete cctv
     * REQUEST: Handle HTTP request
     * WORKS FOR: Both session-based (web) and API requests
     */
    public function destroy(Request $request, $id)
    {
        try {
            // Get employee ID from either session or request
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required. Please provide employee_id in request body or X-Employee-ID header.',
                ], 401);
            }

            // Check if cctv exists
            $cctv = $this->cctvService->findById($id);

            if (!$cctv) {
                return response()->json([
                    'success' => false,
                    'message' => 'CCTV not found'
                ], 404);
            }

            // BUSINESS LOGIC: Delegate to service
            $deleted = $this->cctvService->delete($id, $employeeId);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'CCTV deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete CCTV'
            ], 500);
        } catch (\Exception $e) {
            Log::error('CCTV deletion failed', [
                'cctv_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete CCTV: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate cctv creation request
     * REQUEST LAYER: Input validation
     * NOTE: employee_id is nullable because session users don't need to send it
     */
    protected function validateCCTVCreate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',

            // CCTV fields
            'camera_name' => 'required|string|max:250',
            'channel' => 'nullable|string|max:150',
            'ip_address' => 'nullable|string|max:100',
            'control_no' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'location_ip' => 'nullable|string|max:255',
            'status' => 'nullable|integer',
        ]);
    }

    /**
     * Validate cctv update request
     * REQUEST LAYER: Input validation
     * NOTE: employee_id is nullable because session users don't need to send it
     */
    protected function validateCCTVUpdate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',

            'camera_name' => 'required|string|max:250',
            'channel' => 'nullable|string|max:150',
            'ip_address' => 'nullable|string|max:100',
            'control_no' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'location_ip' => 'nullable|string|max:255',
            'status' => 'nullable|integer',
        ]);
    }
}
