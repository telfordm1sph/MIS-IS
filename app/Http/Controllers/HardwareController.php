<?php

namespace App\Http\Controllers;

use App\Services\HardwareReplacementService;
use App\Services\HardwareService;
use App\Services\HardwareUpdateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class HardwareController extends Controller
{
    protected HardwareService $hardwareService;
    protected HardwareUpdateService $hardwareUpdateService;
    protected HardwareReplacementService $replacementService;

    public function __construct(
        HardwareService $hardwareService,
        HardwareUpdateService $hardwareUpdateService,
        HardwareReplacementService $replacementService
    ) {
        $this->hardwareService = $hardwareService;
        $this->hardwareUpdateService = $hardwareUpdateService;
        $this->replacementService = $replacementService;
    }



    /**
     * Get hardware table with filters
     * REQUEST: Handle HTTP request, validate filters
     * WORKS FOR: Both web (Inertia) and API (JSON) requests
     */
    public function getHardwareTable(Request $request)
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
            'category' => $filters['category'] ?? '',
            'subCategory' => $filters['subCategory'] ?? '',
        ];

        // BUSINESS LOGIC: Delegate to service
        $result = $this->hardwareService->getHardwareTable($filters);

        // Check if request wants JSON (API call) or Inertia (web)
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'pagination' => $result['pagination'],
                'categoryCounts' => $result['categoryCounts'],
                'filters' => $result['filters'],
            ]);
        }

        // Return Inertia view for web interface
        return Inertia::render('Inventory/HardwareTable', [
            'hardware' => $result['data'],
            'pagination' => $result['pagination'],
            'categoryCounts' => $result['categoryCounts'],
            'filters' => $result['filters'],
        ]);
    }

    /**
     * Get hardware logs
     * REQUEST: Handle HTTP request, validate parameters
     * WORKS FOR: Both web and API requests (already returns JSON)
     */
    public function getLogs(Request $request, $hardwareId)
    {
        try {
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);

            // BUSINESS LOGIC: Delegate to service
            $logs = $this->hardwareService->getHardwareLogs($hardwareId, $page, $perPage);

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch logs',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new hardware
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
            $validated = $this->validateHardwareCreate($request);

            // BUSINESS LOGIC: Delegate to service
            $hardware = $this->hardwareUpdateService->createHardware($validated, $employeeId);

            return response()->json([
                'success' => true,
                'message' => 'Hardware created successfully',
                'data' => $hardware,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Hardware creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create hardware: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update hardware with parts and software
     * REQUEST: Handle HTTP request, validate input
     * WORKS FOR: Both session-based (web) and API requests
     */
    public function update(Request $request, int $hardwareId)
    {
        // dd($request->all());
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
            $validated = $this->validateHardwareUpdate($request);

            // BUSINESS LOGIC: Delegate to service
            $hardware = $this->hardwareUpdateService->updateHardware(
                $hardwareId,
                $validated,
                $employeeId
            );

            return response()->json([
                'success' => true,
                'message' => 'Hardware updated successfully',
                'data' => $hardware,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Hardware update failed', [
                'hardware_id' => $hardwareId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update hardware: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete hardware
     * REQUEST: Handle HTTP request
     * WORKS FOR: Both session-based (web) and API requests
     */
    public function destroy(Request $request, $hardwareId)
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

            // BUSINESS LOGIC: Delegate to service
            $this->hardwareService->deleteHardware($hardwareId, $employeeId);

            return response()->json([
                'success' => true,
                'message' => 'Hardware deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Hardware deletion failed', [
                'hardware_id' => $hardwareId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete hardware: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate hardware creation request
     * REQUEST LAYER: Input validation
     * NOTE: employee_id is nullable because session users don't need to send it
     */
    protected function validateHardwareCreate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',
            'assignedUsersIds'   => ['nullable', 'array'],

            // Hardware fields
            'hostname' => 'nullable|string|max:255',
            'category' => 'required|string|max:100',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'processor' => 'nullable|string|max:255',
            'motherboard' => 'nullable|string|max:255',
            'ip_address' => 'nullable|ip',
            'wifi_mac' => 'nullable|string|max:17',
            'lan_mac' => 'nullable|string|max:17',
            'location' => 'nullable|max:55',
            'department' => 'nullable|max:100',
            'station' => 'nullable|max:55',
            'prodline' => 'nullable|max:55',
            'issued_to' => 'nullable|integer',
            'installed_by' => 'nullable|integer',
            'date_issued' => 'nullable|date',
            'remarks' => 'nullable|string|max:500',
            'status' => 'required|integer',

            // Parts array
            'parts' => 'nullable|array',
            'parts.*.part_type' => 'required|string',
            'parts.*.brand' => 'required|string',
            'parts.*.model' => 'required|string',
            'parts.*.specifications' => 'required|string',
            'parts.*.serial_number' => 'nullable|string|max:100',
            'parts.*.condition' => 'nullable|string|max:100',

            // Software array
            'software' => 'nullable|array',
            'software.*.software_name' => 'required|string',
            'software.*.software_type' => 'required|string',
            'software.*.version' => 'required|string',
            'software.*.license_key' => 'nullable|string',
            'software.*.account_user' => 'nullable|string',
            'software.*.account_password' => 'nullable|string',
        ]);
    }

    /**
     * Validate hardware update request
     * REQUEST LAYER: Input validation
     * NOTE: employee_id is nullable because session users don't need to send it
     */
    protected function validateHardwareUpdate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',
            'assignedUsersIds'   => ['nullable', 'array'],

            /*
        |--------------------------------------------------------------------------
        | Hardware fields
        |--------------------------------------------------------------------------
        */
            'hostname' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'brand' => 'sometimes|string|max:100',
            'model' => 'sometimes|string|max:100',
            'serial_number' => 'sometimes|nullable|string|max:100',
            'processor' => 'sometimes|nullable|string|max:255',
            'motherboard' => 'sometimes|nullable|string|max:255',
            'ip_address' => 'sometimes|nullable|ip',
            'wifi_mac' => 'sometimes|nullable|string|max:17',
            'lan_mac' => 'sometimes|nullable|string|max:17',
            'location' => 'nullable|max:55',
            'department' => 'nullable|max:100',
            'station' => 'nullable|max:55',
            'prodline' => 'nullable|max:55',
            'issued_to' => 'sometimes|nullable|integer',
            'installed_by' => 'sometimes|nullable|integer',
            'date_issued' => 'sometimes|nullable|date',
            'remarks' => 'sometimes|nullable|string|max:500',
            'status' => 'sometimes|integer',

            /*
        |--------------------------------------------------------------------------
        | Parts array
        |--------------------------------------------------------------------------
        */
            'parts' => 'sometimes|array',
            'parts.*.id' => 'sometimes|integer|exists:hardware_parts,id',
            'parts.*._delete' => 'sometimes|boolean',

            'parts.*.part_type' =>
            'sometimes|required_without:parts.*._delete|string',
            'parts.*.brand' =>
            'sometimes|required_without:parts.*._delete|string',
            'parts.*.model' =>
            'sometimes|required_without:parts.*._delete|string',
            'parts.*.specifications' =>
            'sometimes|required_without:parts.*._delete|string',
            'parts.*.serial_number' =>
            'sometimes|nullable|string|max:100',

            'parts.*.condition' =>
            'sometimes|nullable|string|max:100',

            'parts.*.removal_reason' =>
            'required_if:parts.*._delete,true|string|max:255',
            'parts.*.removal_condition' =>
            'required_if:parts.*._delete,true|string|in:working,defective,faulty,unknown',
            'parts.*.removal_remarks' =>
            'nullable|string|max:500',

            /*
        |--------------------------------------------------------------------------
        | Software array (FIXED)
        |--------------------------------------------------------------------------
        */
            'software' => 'sometimes|array',
            'software.*.id' => 'sometimes|integer|exists:hardware_software,id',
            'software.*._delete' => 'sometimes|boolean',

            'software.*.software_name' =>
            'sometimes|required_without:software.*._delete|string',
            'software.*.software_type' =>
            'sometimes|required_without:software.*._delete|string',
            'software.*.version' =>
            'sometimes|required_without:software.*._delete|string',

            'software.*.license_key' =>
            'sometimes|nullable|string',
            'software.*.account_user' =>
            'sometimes|nullable|string',
            'software.*.account_password' =>
            'sometimes|nullable|string',

            'software.*.removal_reason' =>
            'required_if:software.*._delete,true|string|max:255',
            'software.*.removal_condition' =>
            'required_if:software.*._delete,true|string',
            'software.*.removal_remarks' =>
            'nullable|string|max:500',
        ]);
    }
    /**
     * Replace hardware component
     * REQUEST: Handle component replacement with inventory management
     * WORKS FOR: Both session-based (web) and API requests
     */
    public function replaceComponent(Request $request)
    {
        try {
            // Get employee ID
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required.',
                ], 401);
            }

            // Validate replacement payload
            $validated = $this->validateReplacementRequest($request);

            // Add employee_id to payload if not present
            if (!isset($validated['employee_id'])) {
                $validated['employee_id'] = $employeeId;
            }


            // Execute replacement
            $hardware = $this->replacementService->replaceComponent($validated);

            return response()->json([
                'success' => true,
                'message' => 'Component replaced successfully',
                'data' => $hardware,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Component replacement failed', [
                'payload' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to replace component: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate replacement request
     * REQUEST LAYER: Input validation for replacement
     */
    protected function validateReplacementRequest(Request $request): array
    {
        return $request->validate([
            'hardware_id' => 'required|integer|exists:hardware,id',
            'component_id' => 'required|string',
            'component_to_replace' => 'nullable|string|max:255',
            'component_type' => 'required|string|in:part,software',
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',
            'hostname' => 'nullable|string|max:255',

            // Old component details
            'old_component_condition' => 'required|string|in:working,faulty,defective',
            'reason' => 'required|string|max:255',
            'remarks' => 'nullable|string|max:500',

            // New component details
            'replacement_part_type' => 'required_if:component_type,part|string|max:100',
            'replacement_brand' => 'required_if:component_type,part|string|max:100',
            'replacement_model' => 'required_if:component_type,part|string|max:100',
            'replacement_specifications' => 'nullable|string',
            'replacement_condition' => 'nullable|string|in:New,Used,Refurbished',
            'replacement_serial_number' => 'nullable|string|max:100',

            // For software replacement
            'replacement_software_name' => 'required_if:component_type,software|string',
            'replacement_software_type' => 'required_if:component_type,software|string',
            'replacement_version' => 'required_if:component_type,software|string',
        ]);
    }

    /**
     * Add component to hardware
     * REQUEST: Handle component addition
     */
    public function addComponent(Request $request)
    {
        // dd("REach controller", $request->all());
        try {
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required.',
                ], 401);
            }

            $validated = $this->validateAddComponentRequest($request);

            if (!isset($validated['employee_id'])) {
                $validated['employee_id'] = $employeeId;
            }

            // Delegate to service (you'll need to create this)
            $hardware = $this->hardwareUpdateService->addComponent($validated);

            return response()->json([
                'success' => true,
                'message' => 'Component added successfully',
                'data' => $hardware,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Component addition failed', [
                'payload' => $request->all(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add component: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove component from hardware
     * REQUEST: Handle component removal
     */
    public function removeComponent(Request $request)
    {
        try {
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required.',
                ], 401);
            }

            $validated = $this->validateRemoveComponentRequest($request);

            if (!isset($validated['employee_id'])) {
                $validated['employee_id'] = $employeeId;
            }

            // Delegate to service (you'll need to create this)
            $hardware = $this->hardwareUpdateService->removeComponent($validated);

            return response()->json([
                'success' => true,
                'message' => 'Component removed successfully',
                'data' => $hardware,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Component removal failed', [
                'payload' => $request->all(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove component: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate add component request
     */
    protected function validateAddComponentRequest(Request $request): array
    {
        return $request->validate([
            'hardware_id' => 'required|integer|exists:hardware,id',
            'component_type' => 'required|string|in:part,software',

            'hostname' => 'nullable|string|max:255',
            'reason' => 'nullable|string|max:500',

            // For adding parts
            'new_part_type' => 'required_if:component_type,part|string|max:100',
            'new_brand' => 'required_if:component_type,part|string|max:100',
            'new_model' => 'required_if:component_type,part|string|max:100',
            'new_specifications' => 'nullable|string',
            'new_condition' => 'nullable|string|in:New,Used,Refurbished',
            'new_serial_number' => 'nullable|string|max:100',

            // For adding software
            'new_software_name' => 'required_if:component_type,software|string',
            'new_software_type' => 'required_if:component_type,software|string',
            'new_version' => 'required_if:component_type,software|string',
            'new_license_key' => 'nullable|string',
            'new_account_user' => 'nullable|string',
            'new_account_password' => 'nullable|string',
        ]);
    }

    /**
     * Validate remove component request
     */
    protected function validateRemoveComponentRequest(Request $request): array
    {
        return $request->validate([
            'hardware_id' => 'required|integer|exists:hardware,id',
            'component_id' => 'required|string',
            'component_type' => 'required|string|in:part,software',
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',
            'hostname' => 'nullable|string|max:255',

            'removal_condition' => 'required|string|in:working,faulty,defective',
            'removal_reason' => 'required|string|max:255',
            'removal_remarks' => 'nullable|string|max:500',
        ]);
    }
}
