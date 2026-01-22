<?php

namespace App\Http\Controllers;

use App\Services\PartsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartsController extends Controller
{
    protected PartsService $partsService;

    public function __construct(PartsService $partsService,)
    {
        $this->partsService = $partsService;
    }
    public function getPartsTable(Request $request)
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
        $result = $this->partsService->getPartsTable($filters, $empData);
        // dd($result);
        return Inertia::render('Inventory/PartsTable', [
            'parts' => $result['data'],
            'pagination' => $result['pagination'],
            // 'statusCounts' => $result['statusCounts'],
            'filters' => $result['filters'],
        ]);
    }
    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'part_type' => 'string | required',
            'brand' => 'string | required',
            'model' => 'string | nullable',
            'specifications' => 'string | nullable',
            'quantity' => 'integer | required',
            'condition' => 'string | nullable',
        ]);
        try {
            $partsType = $this->partsService->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Parts created successfully',
                'id' => $partsType->id,
                'data' => $partsType
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create Parts: ' . $e->getMessage()
            ], 500);
        }
    }
    public function update(Request $request, $id)
    {
        // dd($request->all());
        $validated = $request->validate([
            'part_type' => 'string | required',
            'brand' => 'string | required',
            'model' => 'string | nullable',
            'specifications' => 'string | nullable',
            'quantity' => 'integer | required',
            'condition' => 'string | nullable',
        ]);

        try {
            $requestType = $this->partsService->update($id, $validated);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Part not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Part updated successfully',
                'data' => $requestType
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update part: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $requestType = $this->partsService->findById($id);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Part not found'
                ], 404);
            }

            $deleted = $this->partsService->delete($id);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Part deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete part'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete part: ' . $e->getMessage()
            ], 500);
        }
    }
    protected function decodeFilters(string $encoded): array
    {
        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
