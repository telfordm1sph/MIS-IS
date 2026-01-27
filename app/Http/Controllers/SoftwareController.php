<?php

namespace App\Http\Controllers;

use App\Services\SoftwareService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SoftwareController extends Controller
{
    protected SoftwareService $softwareService;

    public function __construct(SoftwareService $softwareService,)
    {
        $this->softwareService = $softwareService;
    }
    public function getSoftwareTable(Request $request)
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
            'status' => $filters['status'] ?? '',
        ];
        // dd($empData);
        $result = $this->softwareService->getSoftwareTable($filters, $empData);
        // dd($result);
        return Inertia::render('Inventory/SoftwareTable', [
            'softwares' => $result['data'],
            'pagination' => $result['pagination'],
            // 'statusCounts' => $result['statusCounts'],
            'filters' => $result['filters'],
        ]);
    }

    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'software_name' => 'string | required',
            'software_type' => 'string | required',
            'version' => 'string | nullable',
            'publisher' => 'string | nullable',
            'total_licenses' => 'integer | required',

        ]);
        try {
            $partsType = $this->softwareService->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Software created successfully',
                'id' => $partsType->id,
                'data' => $partsType
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create Software: ' . $e->getMessage()
            ], 500);
        }
    }
    public function update(Request $request, $id)
    {
        // dd($request->all());
        $validated = $request->validate([
            'software_name' => 'string | required',
            'software_type' => 'string | required',
            'version' => 'string | nullable',
            'publisher' => 'string | nullable',
            'total_licenses' => 'integer | required',

        ]);

        try {
            $requestType = $this->softwareService->update($id, $validated);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Software not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Software updated successfully',
                'data' => $requestType
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update software: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $requestType = $this->softwareService->findById($id);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Software not found'
                ], 404);
            }

            $deleted = $this->softwareService->delete($id);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Software deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete software'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete software: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getLogs(Request $request, $softwareId)
    {
        try {
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);

            // Call service to get logs
            $logs = $this->softwareService->getSoftwareLogs($softwareId, $page, $perPage);

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch logs',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    protected function decodeFilters(string $encoded): array
    {
        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
