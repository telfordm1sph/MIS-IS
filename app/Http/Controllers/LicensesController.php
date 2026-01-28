<?php

namespace App\Http\Controllers;

use App\Services\LicensesService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LicensesController extends Controller
{
    protected LicensesService $licensesService;

    public function __construct(LicensesService $licensesService)
    {
        $this->licensesService = $licensesService;
    }

    public function getLicensesTable(Request $request)
    {
        $empData = session('emp_data');

        // Decode base64 filters
        $filters = $this->decodeFilters($request->input('f', ''));
        // dd($filters);
        // Validate and set defaults
        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
        ];

        $result = $this->licensesService->getLicensesTable($filters, $empData);

        return Inertia::render('Inventory/SoftwareLicense', [
            'licenses' => $result['data'],
            'pagination' => $result['pagination'],
            'filters' => $result['filters'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'software_inventory_id' => 'required|integer|exists:software_licenses,id',
            'license_key' => 'nullable|string|max:255',
            'account_user' => 'nullable|string|max:255',
            'account_password' => 'nullable|string|max:255',
            'max_activations' => 'nullable|integer|min:0',
            'current_activations' => 'nullable|integer|min:0',
            'subscription_start' => 'nullable|date',
            'subscription_end' => 'nullable|date|after_or_equal:subscription_start',
            'renewal_reminder_days' => 'nullable|integer|min:0',
            'cost_per_license' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        try {
            $license = $this->licensesService->create($validated, session('emp_data'));

            return response()->json([
                'success' => true,
                'message' => 'Software license created successfully',
                'id' => $license->id,
                'data' => $license
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create software license: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'software_inventory_id' => 'required|integer|exists:software_licenses,id',
            'license_key' => 'nullable|string|max:255',
            'account_user' => 'nullable|string|max:255',
            'account_password' => 'nullable|string|max:255',
            'max_activations' => 'nullable|integer|min:0',
            'current_activations' => 'nullable|integer|min:0',
            'subscription_start' => 'nullable|date',
            'subscription_end' => 'nullable|date|after_or_equal:subscription_start',
            'renewal_reminder_days' => 'nullable|integer|min:0',
            'cost_per_license' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        try {
            $license = $this->licensesService->update($id, $validated, session('emp_data'));

            if (!$license) {
                return response()->json([
                    'success' => false,
                    'message' => 'Software license not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Software license updated successfully',
                'data' => $license
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update software license: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $license = $this->licensesService->findById($id);

            if (!$license) {
                return response()->json([
                    'success' => false,
                    'message' => 'Software license not found'
                ], 404);
            }

            $deleted = $this->licensesService->delete($id);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Software license deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete software license'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete software license: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getLogs(Request $request, $licenseId)
    {
        try {
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);

            // Call service to get logs
            $logs = $this->licensesService->getLicensesLogs($licenseId, $page, $perPage);

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch logs',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
