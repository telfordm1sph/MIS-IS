<?php

namespace App\Http\Controllers;

use App\Services\PartsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartsController extends Controller
{
    protected PartsService $partsService;

    public function __construct(PartsService $partsService)
    {
        $this->partsService = $partsService;
    }

    public function getPartsTable(Request $request)
    {
        $filters = $this->decodeFilters($request->input('f', ''));
        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'created_at',
            'sortOrder' => $filters['sortOrder'] ?? 'desc',
            'status' => $filters['status'] ?? '',
        ];

        $result = $this->partsService->getPartsTable($filters);

        return Inertia::render('Inventory/PartsTable', [
            'parts' => $result['data'],
            'pagination' => $result['pagination'],
            'filters' => $result['filters'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'part_type' => 'required|string',
            'brand' => 'required|string',
            'model' => 'nullable|string',
            'specifications' => 'nullable|string',
            'quantity' => 'required|integer',
            'condition' => 'nullable|string',
            'location' => 'nullable|string',
            'unit_cost' => 'nullable|numeric',
            'supplier' => 'nullable|string',
            'reorder_level' => 'nullable|integer',
            'reorder_quantity' => 'nullable|integer',
            'remarks' => 'nullable|string',
        ]);

        $part = $this->partsService->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Part created successfully',
            'data' => $part,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'part_type' => 'required|string',
            'brand' => 'required|string',
            'model' => 'nullable|string',
            'specifications' => 'nullable|string',
            'quantity' => 'required|integer',
            'condition' => 'nullable|string',
            'location' => 'nullable|string',
            'unit_cost' => 'nullable|numeric',
            'supplier' => 'nullable|string',
            'reorder_level' => 'nullable|integer',
            'reorder_quantity' => 'nullable|integer',
            'remarks' => 'nullable|string',
        ]);

        $part = $this->partsService->update($id, $validated);

        if (!$part) {
            return response()->json([
                'success' => false,
                'message' => 'Part not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Part updated successfully',
            'data' => $part,
        ]);
    }

    public function destroy($id)
    {
        $deleted = $this->partsService->delete($id);

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Part not found or could not be deleted'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Part deleted successfully'
        ]);
    }

    protected function decodeFilters(string $encoded): array
    {
        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }
}
