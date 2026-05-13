<?php

namespace App\Services;

use App\Repositories\LocationsRepository;
use App\Models\Locations;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class LocationsService
{
    protected LocationsRepository $locationsRepository;

    public function __construct(LocationsRepository $locationsRepository)
    {
        $this->locationsRepository = $locationsRepository;
    }

    /**
     * Get all locations
     */
    public function getAllLocations(): Collection
    {
        return $this->locationsRepository->getAll();
    }

    /**
     * Get location by ID
     */
    public function getLocationById(int $id): ?Locations
    {
        return $this->locationsRepository->findById($id);
    }

    /**
     * Create new location
     */
    public function createLocation(array $data, $empData = null): Locations
    {
        $locationData = [
            'location_name' => $data['location_name'],
            'location_description' => $data['location_description'] ?? null,
            'created_by_emp_num' => $empData['emp_id'] ?? null,
            'created_by_emp_name' => $empData['emp_name'] ?? null,
            'date_created' => now()->format('Y-m-d H:i:s'),
            'updated_by_emp_num' => $empData['emp_id'] ?? null,
            'updated_by_emp_name' => $empData['emp_name'] ?? null,
            'date_updated' => now()->format('Y-m-d H:i:s'),
        ];

        return $this->locationsRepository->create($locationData);
    }

    /**
     * Update location
     */
    public function updateLocation(int $id, array $data, $empData = null): bool
    {
        $locationData = [
            'location_name' => $data['location_name'],
            'location_description' => $data['location_description'] ?? null,
            'updated_by_emp_num' => $empData['emp_id'] ?? null,
            'updated_by_emp_name' => $empData['emp_name'] ?? null,
            'date_updated' => now()->format('Y-m-d H:i:s'),
        ];

        return $this->locationsRepository->update($id, $locationData);
    }

    /**
     * Delete location
     */
    public function deleteLocation(int $id): bool
    {
        return $this->locationsRepository->delete($id);
    }

    /**
     * Get paginated locations
     */
    public function getPaginatedLocations(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->locationsRepository->paginate($perPage, $page);
    }

    /**
     * Search locations by name
     */
    public function searchLocations(string $name): Collection
    {
        return $this->locationsRepository->searchByName($name);
    }
}