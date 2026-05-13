<?php

namespace App\Repositories;

use App\Models\Locations;
use Illuminate\Database\Eloquent\Collection;

class LocationsRepository
{
    /**
     * Get base query for locations
     */
    public function query()
    {
        return Locations::query();
    }

    /**
     * Get all locations
     */
    public function getAll(): Collection
    {
        return $this->query()->get();
    }

    /**
     * Find location by ID
     */
    public function findById(int $id): ?Locations
    {
        return $this->query()->find($id);
    }

    /**
     * Create new location
     */
    public function create(array $data): Locations
    {
        return Locations::create($data);
    }

    /**
     * Update location
     */
    public function update(int $id, array $data): bool
    {
        $location = $this->findById($id);
        if (!$location) {
            return false;
        }
        return $location->update($data);
    }

    /**
     * Delete location
     */
    public function delete(int $id): bool
    {
        $location = $this->findById($id);
        if (!$location) {
            return false;
        }
        return $location->delete();
    }

    /**
     * Get locations with pagination
     */
    public function paginate(int $perPage = 15, int $page = 1)
    {
        return $this->query()->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Search locations by name
     */
    public function searchByName(string $name): Collection
    {
        return $this->query()
            ->where('location_name', 'like', '%' . $name . '%')
            ->get();
    }
}