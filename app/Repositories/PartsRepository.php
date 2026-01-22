<?php

namespace App\Repositories;

use App\Models\PartInventory;

class PartsRepository
{
    public function query()
    {
        return PartInventory::query();
    }

    public function create(array $data): object
    {
        // Use Eloquent create to trigger created event
        $part = PartInventory::create([
            'part_type'      => $data['part_type'],
            'brand'          => $data['brand'],
            'model'          => $data['model'] ?? null,
            'specifications' => $data['specifications'] ?? null,
            'quantity'       => $data['quantity'] ?? null,
            'condition'      => $data['condition'] ?? null,
        ]);

        return $part;
    }

    public function update(int $id, array $data): ?object
    {
        $part = PartInventory::find($id);

        if (!$part) {
            return null;
        }

        // Update via model instance to trigger updated event
        $part->update([
            'part_type'      => $data['part_type'],
            'brand'          => $data['brand'],
            'model'          => $data['model'] ?? null,
            'specifications' => $data['specifications'] ?? null,
            'quantity'       => $data['quantity'] ?? null,
            'condition'      => $data['condition'] ?? null,
        ]);

        return $part;
    }

    public function delete(int $id): bool
    {
        $part = PartInventory::find($id);

        if (!$part) {
            return false;
        }

        // Delete via model instance to trigger deleted event
        return $part->delete();
    }

    public function findById(int $id): ?object
    {
        return PartInventory::find($id);
    }
}
