<?php

namespace App\Http\Controllers;

use App\Services\PromisService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PromisController extends Controller
{
    protected PromisService $promisService;

    public function __construct(PromisService $promisService)
    {
        $this->promisService = $promisService;
    }

    public function getPromisTable(Request $request)
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
        $result = $this->promisService->getPromisTable($filters);

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
        return Inertia::render('Inventory/PromisTable', [
            'promis' => $result['data'],
            'pagination' => $result['pagination'],
            'filters' => $result['filters'],
        ]);
    }
    public function getLogs(Request $request, $promisId)
    {
        try {
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);

            // BUSINESS LOGIC: Delegate to service
            $logs = $this->promisService->getPromisLogs($promisId, $page, $perPage);

            return response()->json($logs);
        } catch (\Exception $e) {


            return response()->json([
                'error' => 'Failed to fetch logs',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
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
            $validated = $this->validatePromisCreate($request);

            // BUSINESS LOGIC: Delegate to service
            $promis = $this->promisService->create($validated, $employeeId);

            return response()->json([
                'success' => true,
                'message' => 'Promis created successfully',
                'id' => $promis->id,
                'data' => $promis
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {


            return response()->json([
                'success' => false,
                'message' => 'Failed to create promis: ' . $e->getMessage()
            ], 500);
        }
    }

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
            $validated = $this->validatePromisUpdate($request);

            // BUSINESS LOGIC: Delegate to service
            $promis = $this->promisService->update($id, $validated, $employeeId);

            if (!$promis) {
                return response()->json([
                    'success' => false,
                    'message' => 'promis not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'promis updated successfully',
                'data' => $promis
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update promis: ' . $e->getMessage()
            ], 500);
        }
    }

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

            // Check if promis exists
            $promis = $this->promisService->findById($id);

            if (!$promis) {
                return response()->json([
                    'success' => false,
                    'message' => 'Promis not found'
                ], 404);
            }

            // BUSINESS LOGIC: Delegate to service
            $deleted = $this->promisService->delete($id, $employeeId);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Promis deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete Promis'
            ], 500);
        } catch (\Exception $e) {


            return response()->json([
                'success' => false,
                'message' => 'Failed to delete Promis: ' . $e->getMessage()
            ], 500);
        }
    }










    protected function validatePromisCreate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',

            // Promis fields
            'promis_name' => 'required|string|max:150',
            'ip_address' => 'nullable|string|max:100',
            'location' => 'nullable|integer',
            'model_name' => 'nullable|string|max:250',
            'monitor' => 'nullable|string|max:100',
            'mouse' => 'nullable|string|max:100',
            'keyboard' => 'nullable|string|max:100',
            'scanner' => 'nullable|string|max:100',
            'badge_no' => 'nullable|integer',
            'status' => 'nullable|integer',
        ]);
    }

    protected function validatePromiseUpdate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',

            // Promis fields
            'promis_name' => 'required|string|max:150',
            'ip_address' => 'nullable|string|max:100',
            'location' => 'nullable|integer',
            'model_name' => 'nullable|string|max:250',
            'monitor' => 'nullable|string|max:100',
            'mouse' => 'nullable|string|max:100',
            'keyboard' => 'nullable|string|max:100',
            'scanner' => 'nullable|string|max:100',
            'badge_no' => 'nullable|integer',
            'status' => 'nullable|integer',
        ]);
    }
}
