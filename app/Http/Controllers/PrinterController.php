<?php

namespace App\Http\Controllers;

use App\Services\PrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PrinterController extends Controller
{
    protected PrinterService $printerService;

    public function __construct(PrinterService $printerService)
    {
        $this->printerService = $printerService;
    }


    public function getPrinterTable(Request $request)
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
        $result = $this->printerService->getPrinterTable($filters);

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
        return Inertia::render('Inventory/PrinterTable', [
            'printers' => $result['data'],
            'pagination' => $result['pagination'],
            'filters' => $result['filters'],
        ]);
    }


    public function getPrinterParts(Request $request, $printerId)
    {
        try {
            $printer = $this->printerService->findById($printerId);

            if (!$printer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Printer not found'
                ], 404);
            }

            $parts = $printer->parts()->with('part')->get()->map(function ($printerPart) {
                return [
                    'id' => $printerPart->id,
                    'part_type' => $printerPart->part_type,
                    'brand' => $printerPart->brand,
                    'model' => $printerPart->model,
                    'specifications' => $printerPart->specifications,
                    'serial_number' => $printerPart->serial_number,
                    'condition' => $printerPart->condition ?? 'Working',
                    'status' => $printerPart->status,
                    'installed_date' => $printerPart->installed_date,
                    'bypass_inventory' => !$printerPart->source_inventory_id,
                    'part_info' => $printerPart->part ? [
                        'part_type' => $printerPart->part->part_type,
                        'brand' => $printerPart->part->brand,
                        'model' => $printerPart->part->model,
                        'specifications' => $printerPart->part->specifications,
                    ] : null,
                ];
            });

            return response()->json($parts);
        } catch (\Exception $e) {
            Log::error('Failed to fetch printer parts', [
                'printer_id' => $printerId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getLogs(Request $request, $printerId)
    {
        try {
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);

            // BUSINESS LOGIC: Delegate to service
            $logs = $this->printerService->getPrinterLogs($printerId, $page, $perPage);

            return response()->json($logs);
        } catch (\Exception $e) {
            Log::error('Failed to fetch printer logs', [
                'printer_id' => $printerId,
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
            $validated = $this->validatePrinterCreate($request);

            // BUSINESS LOGIC: Delegate to service
            $printer = $this->printerService->create($validated, $employeeId);

            // Process parts if provided
            if (isset($validated['parts']) && is_array($validated['parts'])) {
                $this->printerService->processParts($printer, $validated['parts'], $employeeId);
            }

            return response()->json([
                'success' => true,
                'message' => 'Printer created successfully',
                'id' => $printer->id,
                'data' => $printer
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Printer creation failed', [
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
            $validated = $this->validatePrinterUpdate($request);

            // BUSINESS LOGIC: Delegate to service
            $printer = $this->printerService->update($id, $validated, $employeeId);

            if (!$printer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Printer not found'
                ], 404);
            }

            // Process parts if provided
            if (isset($validated['parts']) && is_array($validated['parts'])) {
                $this->printerService->processParts($printer, $validated['parts'], $employeeId);
            }

            return response()->json([
                'success' => true,
                'message' => 'Printer updated successfully',
                'data' => $printer
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
     * Delete printer
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

            // Check if printer exists
            $printer = $this->printerService->findById($id);

            if (!$printer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Printer not found'
                ], 404);
            }

            // BUSINESS LOGIC: Delegate to service
            $deleted = $this->printerService->delete($id, $employeeId);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Printer deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete printer'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Printer deletion failed', [
                'printer_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete printer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate printer creation request
     * REQUEST LAYER: Input validation
     * NOTE: employee_id is nullable because session users don't need to send it
     */
    protected function validatePrinterCreate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',
            'assignedUsersIds'   => ['nullable', 'array'],
            // Printer fields
            'printer_name' => 'required|string|max:255',
            'ip_address' => 'nullable|string|max:255',
            'printer_type' => 'nullable|string|max:255',
            'printer_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'dpi' => 'nullable|string|max:255',
            'category_status' => 'nullable|string|max:255',
            'toner' => 'nullable|string|max:255',
            'supplier' => 'nullable|string|max:255',
            'status' => 'nullable|integer',

            // Parts (optional)
            'parts' => 'nullable|array',
            'parts.*.id' => 'nullable|integer',
            'parts.*.part_type' => 'required_with:parts|string|max:255',
            'parts.*.brand' => 'required_with:parts|string|max:255',
            'parts.*.model' => 'required_with:parts|string|max:255',
            'parts.*.specifications' => 'nullable|string|max:255',
            'parts.*.serial_number' => 'nullable|string|max:255',
            'parts.*.condition' => 'nullable|string|max:255',
            'parts.*.bypass_inventory' => 'nullable|boolean',
            'parts.*._delete' => 'nullable|boolean',
            'parts.*.removal_reason' => 'nullable|string|max:255',
            'parts.*.removal_condition' => 'nullable|string|max:255',
            'parts.*.removal_remarks' => 'nullable|string|max:500',
        ]);
    }

    /**
     * Validate printer update request
     * REQUEST LAYER: Input validation
     * NOTE: employee_id is nullable because session users don't need to send it
     */
    protected function validatePrinterUpdate(Request $request): array
    {
        return $request->validate([
            // Employee ID (optional - only for API requests without session)
            'employee_id' => 'nullable|integer|exists:masterlist.employee_masterlist,EMPLOYID',
            'assignedUsersIds'   => ['nullable', 'array'],
            // Printer fields (all optional for updates)
            'printer_name' => 'sometimes|required|string|max:255',
            'ip_address' => 'nullable|string|max:255',
            'printer_type' => 'nullable|string|max:255',
            'printer_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'dpi' => 'nullable|string|max:255',
            'category_status' => 'nullable|string|max:255',
            'toner' => 'nullable|string|max:255',
            'supplier' => 'nullable|string|max:255',
            'status' => 'nullable|integer',

            // Parts (optional)
            'parts' => 'nullable|array',
            'parts.*.id' => 'nullable|integer',
            'parts.*.part_type' => 'required_with:parts|string|max:255',
            'parts.*.brand' => 'required_with:parts|string|max:255',
            'parts.*.model' => 'required_with:parts|string|max:255',
            'parts.*.specifications' => 'nullable|string|max:255',
            'parts.*.serial_number' => 'nullable|string|max:255',
            'parts.*.condition' => 'nullable|string|max:255',
            'parts.*.bypass_inventory' => 'nullable|boolean',
            'parts.*._delete' => 'nullable|boolean',
            'parts.*.removal_reason' => 'nullable|string|max:255',
            'parts.*.removal_condition' => 'nullable|string|max:255',
            'parts.*.removal_remarks' => 'nullable|string|max:500',
        ]);
    }
}
