<?php

namespace App\Repositories;

use App\Models\Part;
use App\Models\PartInventory;

class PartsRepository
{
    public function query()
    {
        return PartInventory::with('part');
    }

    public function create(array $data): object
    {
        // 1️⃣ Create or find master part
        $part = Part::firstOrCreate(
            [
                'part_type' => $data['part_type'],
                'brand' => $data['brand'],
                'model' => $data['model'] ?? null,
                'specifications' => $data['specifications'] ?? null,
            ]
        );

        // 2️⃣ Create inventory
        $inventory = PartInventory::create([
            'part_id' => $part->id,
            'quantity' => $data['quantity'] ?? 0,
            'condition' => $data['condition'] ?? null,
            'location' => $data['location'] ?? null,
            'reorder_level' => $data['reorder_level'] ?? 0,
            'reorder_quantity' => $data['reorder_quantity'] ?? 0,
            'unit_cost' => $data['unit_cost'] ?? 0,
            'supplier' => $data['supplier'] ?? null,
            'remarks' => $data['remarks'] ?? null,
        ]);

        return $inventory->load('part');
    }

    public function update(int $id, array $data): ?object
    {
        $inventory = PartInventory::find($id);
        if (!$inventory) return null;

        // Update inventory
        $inventory->update([
            'quantity' => $data['quantity'] ?? $inventory->quantity,
            'condition' => $data['condition'] ?? $inventory->condition,
            'location' => $data['location'] ?? $inventory->location,
            'reorder_level' => $data['reorder_level'] ?? $inventory->reorder_level,
            'reorder_quantity' => $data['reorder_quantity'] ?? $inventory->reorder_quantity,
            'unit_cost' => $data['unit_cost'] ?? $inventory->unit_cost,
            'supplier' => $data['supplier'] ?? $inventory->supplier,
            'remarks' => $data['remarks'] ?? $inventory->remarks,
        ]);

        // Update master part
        $part = $inventory->part;
        if ($part) {
            $part->update([
                'part_type' => $data['part_type'] ?? $part->part_type,
                'brand' => $data['brand'] ?? $part->brand,
                'model' => $data['model'] ?? $part->model,
                'specifications' => $data['specifications'] ?? $part->specifications,
            ]);
        }

        return $inventory->load('part');
    }

    public function delete(int $id): bool
    {
        $inventory = PartInventory::find($id);
        if (!$inventory) return false;

        return $inventory->delete();
    }

    public function findById(int $id): ?object
    {
        return PartInventory::with('part')->find($id);
    }
}
