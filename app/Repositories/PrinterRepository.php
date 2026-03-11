<?php

namespace App\Repositories;

use App\Models\ActivityLog;
use App\Models\Printer;
use App\Models\PrinterPart;
use App\Models\PrinterUsers;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PrinterRepository
{
    public function query()
    {
        return Printer::query();
    }

    public function getPrinterInfoById(int $id)
    {
        return Printer::find($id);
    }

    public function create(array $data): object
    {
        try {
            Log::debug('Creating printer in repository', ['data' => $data]);
            $printer = Printer::create($data);
            Log::debug('Printer created in database', ['printer_id' => $printer->id]);
            return $printer;
        } catch (\Exception $e) {
            Log::error('Database error creating printer', ['error' => $e->getMessage(), 'data' => $data]);
            throw $e;
        }
    }

    public function update(int $id, array $data): ?object
    {
        try {
            Log::debug('Updating printer in repository', ['printer_id' => $id, 'data' => $data]);
            $printer = Printer::find($id);

            if (!$printer) {
                Log::warning('Printer not found for update', ['printer_id' => $id]);
                return null;
            }

            $printer->update($data);
            Log::debug('Printer updated in database', ['printer_id' => $id]);
            return $printer->fresh();
        } catch (\Exception $e) {
            Log::error('Database error updating printer', ['printer_id' => $id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            Log::debug('Deleting printer in repository', ['printer_id' => $id]);
            $printer = Printer::find($id);

            if (!$printer) {
                Log::warning('Printer not found for deletion', ['printer_id' => $id]);
                return false;
            }

            $result = $printer->delete();
            Log::debug('Printer deleted from database', ['printer_id' => $id, 'result' => $result]);
            return $result;
        } catch (\Exception $e) {
            Log::error('Database error deleting printer', ['printer_id' => $id, 'error' => $e->getMessage()]);
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
                'id'            => $log->id,
                'loggable_type' => class_basename($log->loggable_type),
                'action_type'   => $log->action_type,
                'action_by'     => $actionBy,
                'action_at'     => $log->action_at->format('Y-m-d H:i:s'),
                'old_values'    => $log->old_values ?? null,
                'new_values'    => $log->new_values ?? null,
                'remarks'       => $log->remarks,
            ];
        });
    }

    public function findById(int $id): ?object
    {
        return Printer::find($id);
    }

    // ==================== PRINTER USERS OPERATIONS ====================

    /**
     * Get current assigned user IDs for a printer
     * DB OPERATION: Query
     */
    public function getAssignedUserIds(int $printerId): array
    {
        return PrinterUsers::where('printer_id', $printerId)
            ->pluck('user_id')
            ->toArray();
    }

    /**
     * Assign a user to a printer
     * DB OPERATION: Insert
     */
    public function assignUser(int $printerId, string $userId, int $assignedBy): PrinterUsers
    {
        return PrinterUsers::create([
            'printer_id'    => $printerId,
            'user_id'       => $userId,
            'date_assigned' => now(),
            'assigned_by'   => $assignedBy,
        ]);
    }

    /**
     * Remove specific assigned users from a printer
     * DB OPERATION: Delete
     */
    public function removeAssignedUsers(int $printerId, array $userIds): void
    {
        PrinterUsers::where('printer_id', $printerId)
            ->whereIn('user_id', $userIds)
            ->delete();
    }

    /**
     * Remove all assigned users from a printer
     * DB OPERATION: Delete
     */
    public function clearAssignedUsers(int $printerId): void
    {
        PrinterUsers::where('printer_id', $printerId)->delete();
    }

    // ==================== PRINTER PARTS OPERATIONS ====================

    public function createPrinterPart(array $data)
    {
        return PrinterPart::create($data);
    }

    public function findPrinterPartById($id)
    {
        return PrinterPart::find($id);
    }

    public function updatePrinterPart($id, array $data)
    {
        $part = PrinterPart::find($id);
        if ($part) {
            $part->update($data);
            return $part;
        }
        return null;
    }

    public function logPrinterPartChange($printer, $printerPart, $action, $employeeId, $description)
    {
        $partDetails = [
            'part_id'        => $printerPart->id,
            'part_type'      => $printerPart->part_type,
            'brand'          => $printerPart->brand,
            'model'          => $printerPart->model,
            'serial_number'  => $printerPart->serial_number ?? null,
            'specifications' => $printerPart->specifications ?? '-',
            'quantity'       => $printerPart->quantity ?? null,
        ];

        $formatDate = function ($date) {
            if (!$date) return null;
            if ($date instanceof \Carbon\Carbon) return $date->format('Y-m-d');
            return $date;
        };

        if ($action === 'part_removed') {
            ActivityLog::create([
                'loggable_type' => Printer::class,
                'loggable_id'   => $printer->id,
                'action_type'   => 'part_removed',
                'action_by'     => $employeeId,
                'action_at'     => now(),
                'old_values'    => [
                    'printer_name'   => $printer->printer_name ?? $printer->id,
                    'part_details'   => $partDetails,
                    'installed_date' => $formatDate($printerPart->installed_date ?? null),
                    'removed_date'   => $formatDate($printerPart->removed_date ?? null),
                ],
                'new_values'    => null,
                'remarks'       => $description,
                'related_type'  => PrinterPart::class,
                'related_id'    => $printerPart->id,
            ]);
        } else {
            ActivityLog::create([
                'loggable_type' => Printer::class,
                'loggable_id'   => $printer->id,
                'action_type'   => 'part_added',
                'action_by'     => $employeeId,
                'action_at'     => now(),
                'old_values'    => null,
                'new_values'    => [
                    'printer_name'   => $printer->printer_name ?? $printer->id,
                    'part_details'   => $partDetails,
                    'installed_date' => $formatDate($printerPart->installed_date ?? null),
                ],
                'remarks'       => $description,
                'related_type'  => PrinterPart::class,
                'related_id'    => $printerPart->id,
            ]);
        }
    }
}
