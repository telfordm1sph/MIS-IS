<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IssuanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IssuanceController extends Controller
{
    protected IssuanceService $issuanceService;

    public function __construct(IssuanceService $issuanceService)
    {
        $this->issuanceService = $issuanceService;
    }

    /**
     * Get whole unit issuances table
     */
    public function getWholeUnitIssuanceTable(Request $request)
    {
        $employeeId = $this->getEmployeeId($request);

        if (!$employeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Employee identification required.',
            ], 401);
        }

        $filters = $this->decodeFilters($request->input('f', ''));

        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
            'dateFrom' => $filters['dateFrom'] ?? '',
            'dateTo' => $filters['dateTo'] ?? '',
            'employee_id' => $employeeId,
        ];

        $result = $this->issuanceService->getWholeUnitIssuanceTable($filters);

        return response()->json($result);
    }

    /**
     * Get component maintenance issuances table
     */
    public function getComponentMaintenanceIssuanceTable(Request $request)
    {
        $filters = $this->decodeFilters($request->input('f', ''));

        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
            'dateFrom' => $filters['dateFrom'] ?? '',
            'dateTo' => $filters['dateTo'] ?? '',
        ];

        $result = $this->issuanceService->getComponentMaintenanceIssuanceTable($filters);

        return response()->json($result);
    }

    /**
     * Create component maintenance issuance batch (ADD, REPLACE, REMOVE)
     */
    public function createComponentMaintenanceIssuance(Request $request)
    {
        // dd($request->all());
        try {

            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required.',
                ], 401);
            }

            $validated = $request->validate([
                'operations' => 'required|array|min:1',
                'operations.*.operation' => 'required|in:add,replace,remove',
                'operations.*.component_type' => 'required|in:part,software',
                'operations.*.hardware_id' => 'required|integer',
                'operations.*.issued_to' => 'required|string',
                'operations.*.reason' => 'nullable|string',
                'operations.*.remarks' => 'nullable|string',

                // ADD operation fields
                'operations.*.new_component_id' => 'nullable|integer',
                'operations.*.new_part_type' => 'nullable|string',
                'operations.*.new_brand' => 'nullable|string',
                'operations.*.new_model' => 'nullable|string',
                'operations.*.new_specifications' => 'nullable|string',
                'operations.*.new_condition' => 'nullable|string',
                'operations.*.new_serial_number' => 'nullable|string',
                'operations.*.new_software_name' => 'nullable|string',
                'operations.*.new_software_type' => 'nullable|string',
                'operations.*.new_version' => 'nullable|string',
                'operations.*.new_license_key' => 'nullable|string',
                'operations.*.new_account_user' => 'nullable|string',

                // REPLACE operation fields
                'operations.*.component_id' => 'nullable|integer',
                'operations.*.old_component_condition' => 'nullable|string',
                'operations.*.replacement_part_type' => 'nullable|string',
                'operations.*.replacement_brand' => 'nullable|string',
                'operations.*.replacement_model' => 'nullable|string',
                'operations.*.replacement_specifications' => 'nullable|string',
                'operations.*.replacement_condition' => 'nullable|string',
                'operations.*.replacement_serial_number' => 'nullable|string',
                'operations.*.replacement_software_name' => 'nullable|string',
                'operations.*.replacement_software_type' => 'nullable|string',
                'operations.*.replacement_version' => 'nullable|string',
                'operations.*.replacement_license_key' => 'nullable|string',
                'operations.*.replacement_account_user' => 'nullable|string',

                // REMOVE operation fields
                'operations.*.condition' => 'nullable|string',
            ]);

            $result = $this->issuanceService->processComponentMaintenance(
                $validated['operations'],
                $employeeId
            );

            return response()->json($result, $result['success'] ? 200 : 500);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Component maintenance batch failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process component maintenance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update acknowledgement status
     */
    public function updateAcknowledgement(Request $request, $id)
    {
        try {
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required.',
                ], 401);
            }

            $result = $this->issuanceService->updateAcknowledgementStatus($id, $employeeId);

            return response()->json($result, $result['status'] ?? 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update acknowledgement: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get acknowledgement details
     */
    public function getAcknowledgementDetails($id)
    {
        $result = $this->issuanceService->getAcknowledgementDetails($id);
        return response()->json($result);
    }

    /**
     * Create whole unit issuance
     */
    public function createIssuance(Request $request)
    {
        $employeeId = $this->getEmployeeId($request);

        if (!$employeeId) {
            return response()->json([
                'success' => false,
                'message' => 'Employee identification required.',
            ], 401);
        }

        $validated = $request->validate([
            'request_number' => 'required|string',
            'hostnames' => 'required|array',
            'hostnames.*.issued_to' => 'required|string',
            'hostnames.*.hostname' => 'required|string',
            'hostnames.*.location' => 'nullable|string',
            'hostnames.*.remarks' => 'nullable|string',
        ]);

        $result = $this->issuanceService->createWholeUnitIssuance(
            $validated,
            $employeeId
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }
}
