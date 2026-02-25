<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\SoftwareLicense;
use App\Models\User;

class LicensesRepository
{
    public function query()
    {
        return SoftwareLicense::query();
    }

    public function create(array $data): object
    {
        return SoftwareLicense::create($data);
    }

    public function update(int $id, array $data): ?object
    {
        $license = SoftwareLicense::find($id);
        if (!$license) return null;

        $license->update($data);

        return $license->fresh();
    }

    public function delete(int $id): bool
    {
        $license = SoftwareLicense::find($id);

        if (!$license) {
            return false;
        }

        return $license->delete();
    }
    public function getLogsQuery(int $licenseId)
    {
        return ActivityLog::where('loggable_type', SoftwareLicense::class)
            ->where('loggable_id', $licenseId)
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
        return SoftwareLicense::with('software')->find($id);
    }
}
