<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IssuanceService;
use Illuminate\Http\Request;

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
     * Get individual item issuances table
     */
    public function getIndividualItemIssuanceTable(Request $request)
    {
        $filters = $this->decodeFilters($request->input('f', ''));

        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
            'itemType' => $filters['itemType'] ?? '',
            'dateFrom' => $filters['dateFrom'] ?? '',
            'dateTo' => $filters['dateTo'] ?? '',
        ];

        $result = $this->issuanceService->getIndividualItemIssuanceTable($filters);

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return response()->json($result);
    }

    /**
     * Update acknowledgement status
     * REQUEST: Handles both session-based and API requests
     */
    public function updateAcknowledgement(Request $request, $id)
    {
        try {
            // Get employee ID from either session/auth or request body/header
            $employeeId = $this->getEmployeeId($request);

            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee identification required. Please provide employee_id in request body or X-Employee-ID header.',
                ], 401);
            }

            // Delegate to service
            $result = $this->issuanceService->updateAcknowledgementStatus($id, $employeeId);

            // Return proper HTTP status based on service response
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

        $request->validate([
            'request_number' => 'required|string',
            'hostnames' => 'required|array',
            'hostnames.*.issued_to' => 'required|string',
            'hostnames.*.hostname' => 'required|string',
            'hostnames.*.location' => 'nullable|string',
            'hostnames.*.remarks' => 'nullable|string',
        ]);

        $result = $this->issuanceService->createWholeUnitIssuance(
            $request->all(),
            $employeeId
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * Create individual part/software issuance
     */
    // public function createItemIssuance(Request $request)
    // {
    //     $employeeId = $this->getEmployeeId($request);

    //     if (!$employeeId) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Employee identification required.',
    //         ], 401);
    //     }

    //     $request->validate([
    //         'hostname' => 'required|string',
    //         'issued_to' => 'required|string',
    //         'items' => 'required|array',
    //         'items.*.item_type' => 'required|in:1,2',
    //         'items.*.item_id' => 'required|integer',
    //         'items.*.item_name' => 'required|string',
    //         'items.*.quantity' => 'required|integer|min:1',
    //         'items.*.serial_number' => 'nullable|string',
    //         'items.*.remarks' => 'nullable|string',
    //     ]);

    //     $result = $this->issuanceService->createIndividualItemIssuance(
    //         $request->all(),
    //         $employeeId
    //     );

    //     return response()->json($result, $result['success'] ? 200 : 500);
    // }
}
