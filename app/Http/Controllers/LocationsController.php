<?php

namespace App\Http\Controllers;

use App\Services\LocationsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LocationsController extends Controller
{
    protected LocationsService $locationsService;

    public function __construct(LocationsService $locationsService)
    {
        $this->locationsService = $locationsService;
    }

    /**
     * Get all locations or render locations table
     */
    public function index(Request $request)
    {
        // Decode base64 filters if present
        $filters = $this->decodeFilters($request->input('f', ''));

        // Validate and set defaults
        $filters = [
            'page' => (int) ($filters['page'] ?? 1),
            'pageSize' => (int) ($filters['pageSize'] ?? 10),
            'search' => trim($filters['search'] ?? ''),
            'sortField' => $filters['sortField'] ?? 'id',
            'sortOrder' => $filters['sortOrder'] ?? 'asc',
        ];

        // Get locations with filters
        $locations = $this->locationsService->getAllLocations();

        // Apply search filter
        if (!empty($filters['search'])) {
            $locations = $locations->filter(function ($location) use ($filters) {
                return stripos($location->location_name, $filters['search']) !== false;
            });
        }

        // Apply sorting
        $locations = $locations->sortBy($filters['sortField'], SORT_REGULAR, $filters['sortOrder'] === 'desc');

        // Paginate results
        $paginated = $locations->forPage($filters['page'], $filters['pageSize']);
        $pagination = [
            'current_page' => $filters['page'],
            'per_page' => $filters['pageSize'],
            'total' => $locations->count(),
            'last_page' => ceil($locations->count() / $filters['pageSize']),
            'from' => (($filters['page'] - 1) * $filters['pageSize']) + 1,
            'to' => min($filters['page'] * $filters['pageSize'], $locations->count()),
        ];

        // Check if request wants JSON (API call) or Inertia (web)
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $paginated->values(),
                'pagination' => $pagination,
                'filters' => $filters,
            ]);
        }

        // Return Inertia view for web interface
        return Inertia::render('Admin/Location', [
            'locations' => $paginated->values(),
            'pagination' => $pagination,
            'filters' => $filters,
        ]);
    }

    /**
     * Get paginated locations
     */
    public function paginate(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);

            $locations = $this->locationsService->getPaginatedLocations($perPage, $page);

            return response()->json([
                'success' => true,
                'data' => $locations,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get paginated locations', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve locations',
            ], 500);
        }
    }

    /**
     * Get location by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $location = $this->locationsService->getLocationById($id);

            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $location,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get location', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve location',
            ], 500);
        }
    }

    /**
     * Create new location
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $this->validateLocationCreate($request);

            $location = $this->locationsService->createLocation($validated, session('emp_data'));

            return response()->json([
                'success' => true,
                'message' => 'Location created successfully',
                'data' => $location,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Location creation failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create location: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update location
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $this->validateLocationUpdate($request, $id);

            $updated = $this->locationsService->updateLocation($id, $validated, session('emp_data'));

            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Location update failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update location: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete location
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $deleted = $this->locationsService->deleteLocation($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Location deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Location deletion failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete location: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search locations
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $name = $request->get('name', '');

            if (empty($name)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search term is required',
                ], 400);
            }

            $locations = $this->locationsService->searchLocations($name);

            return response()->json([
                'success' => true,
                'data' => $locations,
            ]);
        } catch (\Exception $e) {
            Log::error('Location search failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to search locations',
            ], 500);
        }
    }

  protected function validateLocationCreate(Request $request): array
{
    return $request->validate([
        'location_name' => 'required|string|max:255|unique:qa.location_list,location_name',
        'location_description' => 'nullable|string',
    ]);
}

protected function validateLocationUpdate(Request $request, int $id): array
{
    return $request->validate([
        'location_name' => 'required|string|max:255|unique:qa.location_list,location_name,' . $id,
        'location_description' => 'nullable|string',
    ]);
}
}