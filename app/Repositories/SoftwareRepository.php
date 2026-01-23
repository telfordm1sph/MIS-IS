<?php

namespace App\Repositories;


use App\Models\SoftwareInventory;


class SoftwareRepository
{
    public function query()
    {
        return SoftwareInventory::query();
    }
    public function create(array $data): object
    {
        // Use Eloquent create to trigger created event
        $part = SoftwareInventory::create([
            'software_name'      => $data['software_name'],
            'software_type'          => $data['software_type'],
            'version'          => $data['version'] ?? null,
            'publisher' => $data['publisher'] ?? null,
            'total_licenses'       => $data['total_licenses'] ?? null,
        ]);

        return $part;
    }

    public function update(int $id, array $data): ?object
    {
        $part = SoftwareInventory::find($id);

        if (!$part) {
            return null;
        }

        // Update via version instance to trigger updated event
        $part->update([
            'software_name'      => $data['software_name'],
            'software_type'          => $data['software_type'],
            'version'          => $data['version'] ?? null,
            'publisher' => $data['publisher'] ?? null,
            'total_licenses'       => $data['total_licenses'] ?? null,
        ]);

        return $part;
    }

    public function delete(int $id): bool
    {
        $part = SoftwareInventory::find($id);

        if (!$part) {
            return false;
        }

        // Delete via model instance to trigger deleted event
        return $part->delete();
    }

    public function findById(int $id): ?object
    {
        return SoftwareInventory::find($id);
    }
}
