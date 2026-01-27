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
        $license = SoftwareLicense::create([
            'software_inventory_id' => $data['software_inventory_id'],
            'license_key' => $data['license_key'] ?? null,
            'account_user' => $data['account_user'] ?? null,
            'account_password' => $data['account_password'] ?? null,
            'max_activations' => $data['max_activations'] ?? null,
            'current_activations' => $data['current_activations'] ?? 0,
            'subscription_start' => $data['subscription_start'] ?? null,
            'subscription_end' => $data['subscription_end'] ?? null,
            'renewal_reminder_days' => $data['renewal_reminder_days'] ?? null,
            'cost_per_license' => $data['cost_per_license'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'created_by' => $data['created_by'] ?? null,
            'updated_by' => $data['updated_by'] ?? null,
        ]);

        return $license;
    }

    public function update(int $id, array $data): ?object
    {
        $license = SoftwareLicense::find($id);

        if (!$license) {
            return null;
        }

        $license->update([
            'software_inventory_id' => $data['software_inventory_id'],
            'license_key' => $data['license_key'] ?? null,
            'account_user' => $data['account_user'] ?? null,
            'account_password' => $data['account_password'] ?? null,
            'max_activations' => $data['max_activations'] ?? null,
            'current_activations' => $data['current_activations'] ?? null,
            'subscription_start' => $data['subscription_start'] ?? null,
            'subscription_end' => $data['subscription_end'] ?? null,
            'renewal_reminder_days' => $data['renewal_reminder_days'] ?? null,
            'cost_per_license' => $data['cost_per_license'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'updated_by' => $data['updated_by'] ?? null,
        ]);

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
