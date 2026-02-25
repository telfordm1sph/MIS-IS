<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\Printer;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PrinterRepository
{
    public function query()
    {
        return Printer::query();
    }

    public function create(array $data): object
    {
        try {
            Log::debug('Creating printer in repository', [
                'data' => $data,
            ]);

            $printer = Printer::create($data);

            Log::debug('Printer created in database', [
                'printer_id' => $printer->id,
            ]);

            return $printer;
        } catch (\Exception $e) {
            Log::error('Database error creating printer', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            throw $e;
        }
    }

    public function update(int $id, array $data): ?object
    {
        try {
            Log::debug('Updating printer in repository', [
                'printer_id' => $id,
                'data' => $data,
            ]);

            $printer = Printer::find($id);

            if (!$printer) {
                Log::warning('Printer not found for update', [
                    'printer_id' => $id,
                ]);
                return null;
            }

            $printer->update($data);

            Log::debug('Printer updated in database', [
                'printer_id' => $id,
            ]);

            return $printer->fresh();
        } catch (\Exception $e) {
            Log::error('Database error updating printer', [
                'printer_id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            Log::debug('Deleting printer in repository', [
                'printer_id' => $id,
            ]);

            $printer = Printer::find($id);

            if (!$printer) {
                Log::warning('Printer not found for deletion', [
                    'printer_id' => $id,
                ]);
                return false;
            }

            $result = $printer->delete();

            Log::debug('Printer deleted from database', [
                'printer_id' => $id,
                'result' => $result,
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error('Database error deleting printer', [
                'printer_id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
    public function getLogsQuery(int $printerId)
    {
        return ActivityLog::where('loggable_type', Printer::class)
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
        return Printer::find($id);
    }
}
