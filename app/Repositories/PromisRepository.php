<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\Promis;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PromisRepository
{
    public function query()
    {
        return Promis::query();
    }

    public function create(array $data): object
    {
        try {
            $promis = Promis::create($data);

            return $promis;
        } catch (\Exception $e) {
            throw $e;
        }
    }
    public function update(int $id, array $data): ?object
    {
        try {
            $promis = Promis::find($id);
            if (!$promis) {
                return null;
            }

            // Only update fields provided in $data
            $promis->update($data);

            return $promis->fresh();
        } catch (\Exception $e) {
            throw $e;
        }
    }
    public function delete(int $id): bool
    {
        try {
            $promis = Promis::find($id);
            if (!$promis) {
                return false;
            }

            return $promis->delete();
        } catch (\Exception $e) {
            throw $e;
        }
    }
    public function getLogsQuery(int $promisId)
    {
        return ActivityLog::where('loggable_type', Promis::class)
            ->where('loggable_id', $promisId)
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
        return Promis::find($id);
    }
}
