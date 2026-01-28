<?php

namespace App\Repositories;

use App\Constants\Status;
use App\Models\ActivityLog;
use App\Models\Hardware;
use App\Models\HardwarePart;
use App\Models\HardwareSoftware;
use App\Models\Part;
use App\Models\PartInventory;
use App\Models\SoftwareInventory;
use App\Models\SoftwareLicense;
use App\Models\User;

class HardwareRepository
{
    /**
     * Base query for hardware with relationships
     * DB OPERATION: Query builder
     */
    public function query()
    {
        return Hardware::with([
            'parts',
            'software' => function ($q) {
                $q->select('id', 'hardware_id', 'software_inventory_id', 'software_license_id', 'installation_date', 'status');

                $q->with([
                    'softwareInventory:id,software_name,software_type,version',
                    'softwareLicense:id,license_key,account_user'
                ]);
            },
            'issuedToUser',
            'installedByUser'
        ]);
    }

    /**
     * Paginate query
     * DB OPERATION: Pagination
     */
    public function paginate($query, int $pageSize, int $page)
    {
        return $query->paginate($pageSize, ['*'], 'page', $page);
    }

    /**
     * Get category counts
     * DB OPERATION: Aggregate query
     */
    public function getCategoryCounts(): array
    {
        $counts = Hardware::active()
            ->groupBy('category')
            ->selectRaw('category, count(*) as count')
            ->pluck('count', 'category')
            ->toArray();

        $statusCounts = [
            'New' => Hardware::where('status', Status::NEW)->count(),
            'Inactive' => Hardware::where('status', Status::INACTIVE)->count(),
            'Defective' => Hardware::where('status', Status::DEFECTIVE)->count(),
        ];

        return array_merge($counts, $statusCounts);
    }

    /**
     * Get hardware status counts
     * DB OPERATION: Aggregate query
     */
    public function getHardwareStatusCounts($query): array
    {
        $statusCounts = $query->clone()
            ->groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();

        $result = [];
        $total = array_sum($statusCounts);

        $result['All'] = [
            'count' => $total,
            'color' => 'default',
        ];

        foreach (Status::LABELS as $value => $label) {
            $result[$label] = [
                'count' => $statusCounts[$value] ?? 0,
                'color' => Status::COLORS[$value] ?? 'default',
            ];
        }

        return $result;
    }

    /**
     * Get logs query
     * DB OPERATION: Query builder for logs
     */
    public function getLogsQuery(int $hardwareId)
    {
        $hardware = Hardware::with(['parts', 'software'])->findOrFail($hardwareId);

        $partsIds = $hardware->parts->pluck('id')->toArray();
        $softwareIds = $hardware->software->pluck('id')->toArray();

        return ActivityLog::query()
            ->where(function ($q) use ($hardware, $partsIds, $softwareIds) {
                $q->where(function ($subQ) use ($hardware) {
                    $subQ->where('loggable_type', Hardware::class)
                        ->where('loggable_id', $hardware->id);
                });

                if (!empty($partsIds)) {
                    $q->orWhere(function ($subQ) use ($partsIds) {
                        $subQ->where('loggable_type', HardwarePart::class)
                            ->whereIn('loggable_id', $partsIds);
                    });
                }

                if (!empty($softwareIds)) {
                    $q->orWhere(function ($subQ) use ($softwareIds) {
                        $subQ->where('loggable_type', HardwareSoftware::class)
                            ->whereIn('loggable_id', $softwareIds);
                    });
                }
            })
            ->orderBy('action_at', 'desc');
    }

    /**
     * Count query results
     * DB OPERATION: Count
     */
    public function countQuery($query): int
    {
        return $query->count();
    }

    /**
     * Get paginated logs
     * DB OPERATION: Pagination with offset
     */
    public function getPaginatedLogs($query, int $offset, int $limit)
    {
        return $query->skip($offset)->take($limit)->get();
    }

    /**
     * Format logs with user names
     * DB OPERATION: Read users and format data
     */
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

    /**
     * Find hardware by ID
     * DB OPERATION: Find by primary key
     */
    public function findById(int $hardwareId): ?Hardware
    {
        return Hardware::find($hardwareId);
    }

    /**
     * Find hardware with relationships
     * DB OPERATION: Find with eager loading
     */
    public function findWithRelations(int $hardwareId): ?Hardware
    {
        return Hardware::with([
            'parts',
            'software.softwareInventory',
            'software.softwareLicense',
            'issuedToUser',
            'installedByUser'
        ])->find($hardwareId);
    }

    /**
     * Create hardware
     * DB OPERATION: Insert
     */
    public function createHardware(array $data): Hardware
    {
        return Hardware::create($data);
    }

    /**
     * Update hardware
     * DB OPERATION: Update
     * FIXED: Use model instance for proper logging
     */
    public function updateHardware(int $hardwareId, array $data): void
    {
        $hardware = Hardware::find($hardwareId);
        if ($hardware) {
            $hardware->update($data);
        }
    }

    /**
     * Delete hardware with relations
     * DB OPERATION: Delete with cascade
     */
    public function deleteHardwareWithRelations(Hardware $hardware): void
    {
        $hardware->parts()->delete();
        $hardware->software()->delete();
        $hardware->delete();
    }

    // ==================== PARTS OPERATIONS ====================

    /**
     * Find part by specifications
     * DB OPERATION: Find part
     */
    public function findPart(string $partType, string $brand, string $model, string $specifications): ?Part
    {
        return Part::where('part_type', $partType)
            ->where('brand', $brand)
            ->where('model', $model)
            ->where('specifications', $specifications)
            ->first();
    }

    /**
     * Find available part inventory
     * DB OPERATION: Find inventory with conditions
     */
    public function findAvailablePartInventory(int $partId): ?PartInventory
    {
        return PartInventory::where('part_id', $partId)
            ->whereIn('condition', ['New', 'Working'])
            ->where('quantity', '>', 0)
            ->first();
    }

    /**
     * Find or create part inventory
     * DB OPERATION: First or create
     */
    public function findOrCreatePartInventory(int $partId, string $condition): PartInventory
    {
        return PartInventory::firstOrCreate(
            [
                'part_id' => $partId,
                'condition' => $condition,
            ],
            [
                'quantity' => 0,
                'location' => 'Storage',
                'remarks' => 'Auto-created from hardware removal',
            ]
        );
    }

    /**
     * Increment inventory with context
     * DB OPERATION: Increment
     * ENHANCED: Now logs the reason for increment
     * 
     * @param int $inventoryId
     * @param int $amount
     * @param string|null $reason Why the inventory is being incremented
     * @param int|null $employeeId Who performed the action
     */
    public function incrementInventory(int $inventoryId, int $amount, ?string $reason = null, ?int $employeeId = null): void
    {
        $inventory = PartInventory::find($inventoryId);
        if ($inventory) {
            // Store old quantity for logging
            $oldQuantity = $inventory->quantity;

            // Perform the increment
            $inventory->increment('quantity', $amount);

            // Create additional context log if reason is provided
            if ($reason) {
                // Refresh the inventory to get new quantity
                $inventory->refresh();

                $this->createInventoryContextLog(
                    $inventory,
                    'increment',
                    $oldQuantity,
                    $inventory->quantity,
                    $reason,
                    $employeeId
                );
            }
        }
    }

    /**
     * Decrement inventory with context
     * DB OPERATION: Decrement
     * ENHANCED: Now logs the reason for decrement
     * 
     * @param int $inventoryId
     * @param int $amount
     * @param string|null $reason Why the inventory is being decremented
     * @param int|null $employeeId Who performed the action
     */
    public function decrementInventory(int $inventoryId, int $amount, ?string $reason = null, ?int $employeeId = null): void
    {
        $inventory = PartInventory::find($inventoryId);
        if ($inventory) {
            // Store old quantity for logging
            $oldQuantity = $inventory->quantity;

            // Perform the decrement
            $inventory->decrement('quantity', $amount);

            // Create additional context log if reason is provided
            if ($reason) {
                // Refresh the inventory to get new quantity
                $inventory->refresh();

                $this->createInventoryContextLog(
                    $inventory,
                    'decrement',
                    $oldQuantity,
                    $inventory->quantity,
                    $reason,
                    $employeeId
                );
            }
        }
    }

    /**
     * Create contextual log for inventory changes
     * DB OPERATION: Insert log with context
     * 
     * This creates a manual log entry that explains WHY the inventory changed,
     * complementing the automatic Loggable trait logs
     */
    protected function createInventoryContextLog(
        PartInventory $inventory,
        string $operation,
        int $oldQuantity,
        int $newQuantity,
        string $reason,
        ?int $employeeId
    ): void {
        // Load the part relationship if not loaded
        $inventory->loadMissing('part');

        $partInfo = $inventory->part
            ? "{$inventory->part->part_type} - {$inventory->part->brand} {$inventory->part->model}"
            : "Part ID: {$inventory->part_id}";

        ActivityLog::create([
            'loggable_type' => PartInventory::class,
            'loggable_id' => $inventory->id,
            'action_type' => $operation === 'increment' ? 'inventory_increment' : 'inventory_decrement',
            'action_by' => $employeeId ?? 'system',
            'action_at' => now(),
            'old_values' => [
                'quantity' => $oldQuantity,
                'condition' => $inventory->condition,
                'part_info' => $partInfo,
            ],
            'new_values' => [
                'quantity' => $newQuantity,
                'condition' => $inventory->condition,
                'part_info' => $partInfo,
            ],
            'remarks' => $reason,
        ]);
    }

    /**
     * Create hardware part
     * DB OPERATION: Insert
     */
    public function createHardwarePart(array $data): HardwarePart
    {
        return HardwarePart::create($data);
    }

    /**
     * Find hardware part by ID
     * DB OPERATION: Find
     */
    public function findHardwarePartById(int $hardwarePartId): ?HardwarePart
    {
        return HardwarePart::find($hardwarePartId);
    }

    /**
     * Update hardware part
     * DB OPERATION: Update
     * FIXED: Use model instance for proper logging
     */
    public function updateHardwarePart(int $hardwarePartId, array $data): void
    {
        $hardwarePart = HardwarePart::find($hardwarePartId);
        if ($hardwarePart) {
            $hardwarePart->update($data);
        }
    }

    /**
     * Delete hardware part
     * DB OPERATION: Delete
     * FIXED: Use model instance for proper logging
     */
    public function deleteHardwarePart(int $hardwarePartId): void
    {
        $hardwarePart = HardwarePart::find($hardwarePartId);
        if ($hardwarePart) {
            $hardwarePart->delete();
        }
    }

    // ==================== SOFTWARE OPERATIONS ====================

    /**
     * Find software inventory
     * DB OPERATION: Find software
     */
    public function findSoftwareInventory(string $softwareName, string $softwareType, string $version): ?SoftwareInventory
    {
        return SoftwareInventory::where('software_name', $softwareName)
            ->where('software_type', $softwareType)
            ->where('version', $version)
            ->first();
    }

    /**
     * Find software license by identifier
     * DB OPERATION: Find license
     */
    public function findSoftwareLicenseByIdentifier(?string $licenseKey, ?string $accountUser): ?SoftwareLicense
    {
        $query = SoftwareLicense::query();

        if ($licenseKey) {
            $query->where('license_key', $licenseKey);
        } elseif ($accountUser) {
            $query->where('account_user', $accountUser);
        }

        return $query->first();
    }

    /**
     * Find software license by ID
     * DB OPERATION: Find
     */
    public function findSoftwareLicense(int $licenseId): ?SoftwareLicense
    {
        return SoftwareLicense::find($licenseId);
    }

    /**
     * Increment license activation with context
     * DB OPERATION: Increment
     * ENHANCED: Now logs the reason for activation
     * 
     * @param int $licenseId
     * @param int $amount
     * @param string|null $reason Why the license is being activated (e.g., hardware hostname)
     * @param int|null $employeeId Who performed the action
     */
    public function incrementLicenseActivation(int $licenseId, int $amount, ?string $reason = null, ?int $employeeId = null): void
    {
        $license = SoftwareLicense::find($licenseId);
        if ($license) {
            // Store old activations for logging
            $oldActivations = $license->current_activations;

            // Perform the increment
            $license->increment('current_activations', $amount);

            // Create additional context log if reason is provided
            if ($reason) {
                // Refresh the license to get new activations
                $license->refresh();

                $this->createLicenseContextLog(
                    $license,
                    'activation',
                    $oldActivations,
                    $license->current_activations,
                    $reason,
                    $employeeId
                );
            }
        }
    }

    /**
     * Decrement license activation with context
     * DB OPERATION: Decrement
     * ENHANCED: Now logs the reason for deactivation
     * 
     * @param int $licenseId
     * @param int $amount
     * @param string|null $reason Why the license is being deactivated (e.g., hardware hostname)
     * @param int|null $employeeId Who performed the action
     */
    public function decrementLicenseActivation(int $licenseId, int $amount, ?string $reason = null, ?int $employeeId = null): void
    {
        $license = SoftwareLicense::find($licenseId);
        if ($license) {
            // Store old activations for logging
            $oldActivations = $license->current_activations;

            // Perform the decrement
            $license->decrement('current_activations', $amount);

            // Create additional context log if reason is provided
            if ($reason) {
                // Refresh the license to get new activations
                $license->refresh();

                $this->createLicenseContextLog(
                    $license,
                    'deactivation',
                    $oldActivations,
                    $license->current_activations,
                    $reason,
                    $employeeId
                );
            }
        }
    }

    /**
     * Create contextual log for license activation changes
     * DB OPERATION: Insert log with context
     * 
     * This creates a manual log entry that explains WHY the license activation changed,
     * complementing the automatic Loggable trait logs
     */
    protected function createLicenseContextLog(
        SoftwareLicense $license,
        string $operation,
        int $oldActivations,
        int $newActivations,
        string $reason,
        ?int $employeeId
    ): void {
        // Load the software relationship if not loaded
        $license->loadMissing('software');

        // Build software info
        $softwareInfo = "License: {$license->license_key}";
        if ($license->software) {
            $softwareInfo = "{$license->software->software_name} ({$license->software->software_type}) v{$license->software->version}";
        } elseif ($license->account_user) {
            $softwareInfo .= " (Account: {$license->account_user})";
        }

        ActivityLog::create([
            'loggable_type' => SoftwareLicense::class,
            'loggable_id' => $license->id,
            'action_type' => $operation === 'activation' ? 'license_activated' : 'license_deactivated',
            'action_by' => $employeeId ?? 'system',
            'action_at' => now(),
            'old_values' => [
                'current_activations' => $oldActivations,
                'max_activations' => $license->max_activations,
                'software_info' => $softwareInfo,
                'license_key' => $license->license_key,
            ],
            'new_values' => [
                'current_activations' => $newActivations,
                'max_activations' => $license->max_activations,
                'software_info' => $softwareInfo,
                'license_key' => $license->license_key,
            ],
            'remarks' => $reason,
        ]);
    }

    /**
     * Create hardware software
     * DB OPERATION: Insert
     */
    public function createHardwareSoftware(array $data): HardwareSoftware
    {
        return HardwareSoftware::create($data);
    }

    /**
     * Find hardware software by ID
     * DB OPERATION: Find
     */
    public function findHardwareSoftwareById(int $hardwareSoftwareId): ?HardwareSoftware
    {
        return HardwareSoftware::find($hardwareSoftwareId);
    }

    /**
     * Update hardware software
     * DB OPERATION: Update
     * FIXED: Use model instance for proper logging
     */
    public function updateHardwareSoftware(int $hardwareSoftwareId, array $data): void
    {
        $hardwareSoftware = HardwareSoftware::find($hardwareSoftwareId);
        if ($hardwareSoftware) {
            $hardwareSoftware->update($data);
        }
    }

    /**
     * Delete hardware software
     * DB OPERATION: Delete
     * FIXED: Use model instance for proper logging
     */
    public function deleteHardwareSoftware(int $hardwareSoftwareId): void
    {
        $hardwareSoftware = HardwareSoftware::find($hardwareSoftwareId);
        if ($hardwareSoftware) {
            $hardwareSoftware->delete();
        }
    }

    // ==================== ADDITIONAL QUERIES ====================

    /**
     * Find hardware by hostname
     * DB OPERATION: Find by unique field
     */
    public function findByHostname(string $hostname): ?Hardware
    {
        return Hardware::where('hostname', $hostname)->first();
    }

    /**
     * Get hardware by status
     * DB OPERATION: Filter by status
     */
    public function getByStatus(int $status)
    {
        return $this->query()->where('status', $status);
    }

    /**
     * Get hardware by category
     * DB OPERATION: Filter by category
     */
    public function getByCategory(string $category)
    {
        return $this->query()->where('category', $category);
    }

    /**
     * Search hardware
     * DB OPERATION: Search query
     */
    public function search(string $searchTerm)
    {
        return $this->query()->where(function ($q) use ($searchTerm) {
            $q->where('hostname', 'like', "%{$searchTerm}%")
                ->orWhere('brand', 'like', "%{$searchTerm}%")
                ->orWhere('model', 'like', "%{$searchTerm}%")
                ->orWhere('serial_number', 'like', "%{$searchTerm}%")
                ->orWhere('location', 'like', "%{$searchTerm}%");
        });
    }

    /**
     * Get hardware issued to user
     * DB OPERATION: Filter by user
     */
    public function getIssuedToUser(int $userId)
    {
        return $this->query()->where('issued_to', $userId);
    }

    /**
     * Get recent hardware
     * DB OPERATION: Order and limit
     */
    public function getRecent(int $limit = 10)
    {
        return $this->query()
            ->orderBy('created_at', 'desc')
            ->limit($limit);
    }

    /**
     * Get hardware statistics
     * DB OPERATION: Multiple aggregate queries
     */
    public function getStatistics(): array
    {
        $totalHardware = Hardware::count();
        $activeHardware = Hardware::where('status', Status::ACTIVE)->count();
        $inactiveHardware = Hardware::where('status', Status::INACTIVE)->count();
        $defectiveHardware = Hardware::where('status', Status::DEFECTIVE)->count();

        $categoryCounts = Hardware::groupBy('category')
            ->selectRaw('category, count(*) as count')
            ->pluck('count', 'category')
            ->toArray();

        return [
            'total' => $totalHardware,
            'active' => $activeHardware,
            'inactive' => $inactiveHardware,
            'defective' => $defectiveHardware,
            'by_category' => $categoryCounts,
        ];
    }
}
