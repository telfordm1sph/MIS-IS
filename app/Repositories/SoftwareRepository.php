<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\SoftwareInventory;
use App\Models\SoftwareLicense;
use App\Models\User;

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
    public function getLogsQuery(int $softwareId)
    {
        return ActivityLog::where('loggable_type', SoftwareInventory::class)
            ->where('loggable_id', $softwareId)
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
        return SoftwareInventory::find($id);
    }
}
