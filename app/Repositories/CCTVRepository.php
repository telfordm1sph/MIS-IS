<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\CCTV;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class CCTVRepository
{
    public function query()
    {
        return CCTV::query();
    }

    public function create(array $data): object
    {
        try {
            Log::debug('Inserting CCTV into DB', ['data' => $data]);

            // Only responsibility: save to DB
            $cctv = CCTV::create($data);

            Log::debug('CCTV created in DB', ['cctv_id' => $cctv->id]);

            return $cctv;
        } catch (\Exception $e) {
            Log::error('Database error creating CCTV', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            throw $e;
        }
    }

    public function update(int $id, array $data): ?object
    {
        try {
            $cctv = CCTV::find($id);
            if (!$cctv) {
                Log::warning('CCTV not found for update', ['cctv_id' => $id]);
                return null;
            }

            // Only update fields provided in $data
            $cctv->update($data);

            Log::debug('CCTV updated in DB', ['cctv_id' => $id]);

            return $cctv->fresh();
        } catch (\Exception $e) {
            Log::error('Database error updating CCTV', [
                'cctv_id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            Log::debug('Deleting CCTV in repository', [
                'cctv_id' => $id,
            ]);

            $cctv = CCTV::find($id);

            if (!$cctv) {
                Log::warning('CCTV not found for deletion', [
                    'printer_id' => $id,
                ]);
                return false;
            }

            $result = $cctv->delete();

            Log::debug('CCTV deleted from database', [
                'cctv_id' => $id,
                'result' => $result,
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error('Database error deleting cctv', [
                'cctv_id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
    public function getLogsQuery(int $cctvId)
    {
        return ActivityLog::where('loggable_type', CCTV::class)
            ->where('loggable_id', $cctvId)
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
        return CCTV::find($id);
    }
}
