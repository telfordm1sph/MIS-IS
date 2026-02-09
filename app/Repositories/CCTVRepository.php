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
            Log::debug('Creating CCTV in repository', [
                'data' => $data,
            ]);

            $cctv = CCTV::create([
                'camera_name' => $data['camera_name'],
                'channel' => $data['channel'] ?? null,
                'ip_address' => $data['ip_address'] ?? null,
                'control_no' => $data['control_no'] ?? null,
                'location' => $data['location'] ?? null,
                'location_ip' => $data['location_ip'] ?? null,
                'status' => $data['status'] ?? null,
                'created_by' => $data['created_by'] ?? null,
                'updated_by' => $data['updated_by'] ?? null,
            ]);

            Log::debug('CCTV created in database', [
                'cctv_id' => $cctv->id,
            ]);

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
            Log::debug('Updating CCTV in repository', [
                'cctv_id' => $id,
                'data' => $data,
            ]);

            $cctv = CCTV::find($id);
            if (!$cctv) {
                Log::warning('CCTV not found for update', [
                    'cctv_id' => $id,
                ]);
                return null;
            }

            $cctv->update([
                'camera_name' => $data['camera_name'] ?? $cctv->camera_name,
                'channel' => $data['channel'] ?? $cctv->channel,
                'ip_address' => $data['ip_address'] ?? $cctv->ip_address,
                'control_no' => $data['control_no'] ?? $cctv->control_no,
                'location' => $data['location'] ?? $cctv->location,
                'location_ip' => $data['location_ip'] ?? $cctv->location_ip,
                'status' => $data['status'] ?? $cctv->status,
                'updated_by' => $data['updated_by'] ?? $cctv->updated_by,
                'updated_at' => now(),

            ]);

            Log::debug('CCTV updated in database', [
                'cctv_id' => $id,
            ]);

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
    public function getLogsQuery(int $printerId)
    {
        return ActivityLog::where('loggable_type', CCTV::class)
            ->where('loggable_id', $printerId)
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
