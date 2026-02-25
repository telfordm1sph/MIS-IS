<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\Part;
use App\Models\PartInventory;
use App\Models\User;

class PartsRepository
{
    public function query()
    {
        return PartInventory::with('part');
    }

    public function create(array $partData, array $inventoryData): object
    {
        $part = Part::firstOrCreate($partData);

        $inventory = PartInventory::create(
            array_merge($inventoryData, ['part_id' => $part->id])
        );

        return $inventory->load('part');
    }

    public function update(int $id, array $partData, array $inventoryData): ?object
    {
        $inventory = PartInventory::find($id);
        if (!$inventory) return null;

        $inventory->update(array_filter($inventoryData, fn($value) => !is_null($value)));

        $part = $inventory->part;
        if ($part) {
            $part->update(array_filter($partData, fn($value) => !is_null($value)));
        }

        return $inventory->load('part');
    }

    public function delete(int $id): bool
    {
        $inventory = PartInventory::find($id);
        if (!$inventory) return false;

        return $inventory->delete();
    }
    public function getLogsQuery(int $partsId)
    {
        return ActivityLog::where(function ($query) use ($partsId) {
            $query->where('loggable_type', PartInventory::class)
                ->where('loggable_id', $partsId);
        })
            ->orWhere(function ($query) use ($partsId) {
                // Get the part_id from the inventory
                $inventory = PartInventory::find($partsId);
                if ($inventory && $inventory->part_id) {
                    $query->where('loggable_type', Part::class)
                        ->where('loggable_id', $inventory->part_id);
                }
            })
            ->orderBy('action_at', 'desc');
    }

    public function formatLogs($logs)
    {
        $userIds = $logs->pluck('action_by')->filter(fn($id) => is_numeric($id))->unique();
        $users = User::whereIn('EMPLOYID', $userIds)->pluck('EMPNAME', 'EMPLOYID');

        return $logs->map(function ($log) use ($users) {
            $actionBy = $log->action_by;
            if (is_numeric($actionBy)) {
                $actionBy = $users[$actionBy] ?? $actionBy;
            }

            return [
                'id' => $log->id,
                'loggable_type' => class_basename($log->loggable_type),
                'action_type' => $log->action_type,
                'action_by' => $actionBy,
                'action_at' => $log->action_at->format('Y-m-d H:i:s'),
                'old_values' => $log->old_values ?? null,
                'new_values' => $log->new_values ?? null,
                'remarks' => $log->remarks,
            ];
        });
    }
    public function findById(int $id): ?object
    {
        return PartInventory::with('part')->find($id);
    }
}
