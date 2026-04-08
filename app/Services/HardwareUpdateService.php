<?php

namespace App\Services;

use App\Repositories\HardwareRepository;
use App\Models\Hardware;
use App\Models\HardwarePart;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HardwareUpdateService
{
    use Traits\PartOperationsTrait;

    public HardwareRepository $hardwareRepository;

    private string $currentEntityType = 'hardware';

    public function __construct(
        HardwareRepository $hardwareRepository
    ) {
        $this->hardwareRepository = $hardwareRepository;
    }

    // PartOperationsTrait abstract method implementations
    protected function getEntityType($entity): string
    {
        return $this->currentEntityType;
    }

    protected function getEntityName($entity): string
    {
        return $entity->hostname ?? $entity->printer_name ?? '';
    }

    protected function getEntityId($entity): int
    {
        return $entity->id;
    }

    protected function createPartRecord($entity, array $partData, string $condition, int $inventoryId, int $employeeId)
    {
        $data = [
            'hardware_id'         => $entity->id,
            'part_type'           => $partData['part_type'],
            'brand'               => $partData['brand'],
            'model'               => $partData['model'],
            'specifications'      => $partData['specifications'] ?? '',
            'condition'           => $condition,
            'serial_number'       => $partData['serial_number'] ?? null,
            'source_inventory_id' => $inventoryId,
            'status'              => 'installed',
            'installed_date'      => now(),
            'created_by'          => $employeeId,
        ];

        return $this->hardwareRepository->createEntityPart($data, $this->currentEntityType);
    }

    protected function createPartRecordManual($entity, array $partData, int $employeeId)
    {
        $data = [
            'hardware_id'    => $entity->id,
            'part_type'      => $partData['part_type'],
            'brand'          => $partData['brand'],
            'model'          => $partData['model'],
            'specifications' => $partData['specifications'] ?? null,
            'serial_number'  => $partData['serial_number'] ?? null,
            'condition'      => $partData['condition'] ?? 'Working',
            'status'         => 'installed',
            'installed_date' => now(),
            'created_by'     => $employeeId,
        ];

        return $this->hardwareRepository->createEntityPart($data, $this->currentEntityType);
    }

    protected function findPartRecordById(int $id)
    {
        return $this->hardwareRepository->findEntityPartById($id, $this->currentEntityType);
    }

    protected function updatePartRecord(int $id, array $data): void
    {
        $this->hardwareRepository->updateEntityPart($id, $data, $this->currentEntityType);
    }

    protected function logPartAddition($entity, $partRecord, $part, string $condition, int $employeeId): void
    {
        $this->hardwareRepository->logHardwarePartChange(
            $entity,
            $partRecord,
            'part_added',
            $employeeId,
            "Added {$part->part_type} - {$part->brand} {$part->model} ({$condition})"
        );
    }

    protected function logPartRemoval($entity, $partRecord, $part, string $condition, string $removalReason, int $employeeId): void
    {
        $this->hardwareRepository->logHardwarePartChange(
            $entity,
            $partRecord,
            'part_removed',
            $employeeId,
            "Removed {$part->part_type} - {$part->brand} {$part->model}. Reason: {$removalReason}. Condition: {$condition}"
        );
    }

    protected function logPartAdditionManual($entity, $partRecord, string $partType, string $brand, string $model, int $employeeId): void
    {
        $this->hardwareRepository->logHardwarePartChange(
            $entity,
            $partRecord,
            'part_added_manual',
            $employeeId,
            "Added {$partType} - {$brand} {$model} (Manual)"
        );
    }

    protected function getRemovedStatus(): string
    {
        return 'Removed';
    }

    protected function getEntityTypeFromPartRecord($partRecord): string
    {
        return $this->currentEntityType;
    }

    protected function getEntityTypeFromPartData(array $partData): string
    {
        return $this->currentEntityType;
    }

    public function createHardware(array $data, int $employeeId): Hardware
    {
        return DB::transaction(function () use ($data, $employeeId) {
            $hardwareData = $this->prepareHardwareData($data, $employeeId, true);

            $hardwareData['hostname'] = $this->resolveHostnameForCreate(
                $hardwareData['hostname'] ?? null,
                $hardwareData['category'] ?? null
            );

            $issuedTo = $this->extractIssuedTo($data);

            $hardware = $this->hardwareRepository->createHardware($hardwareData);

            Log::info("Hardware created", [
                'hardware_id' => $hardware->id,
                'hostname'    => $hardware->hostname,
                'created_by'  => $employeeId,
            ]);

            if (!empty($issuedTo)) {
                $this->syncAssignedUsers($hardware, $issuedTo, $employeeId);
            }

            if (isset($data['parts']) && is_array($data['parts'])) {
                foreach ($data['parts'] as $partData) {
                    if (!empty($partData['bypass_inventory'])) {
                        $this->createPartManual($hardware, $partData, $employeeId);
                    } else {
                        $this->createPart($hardware, $partData, $employeeId);
                    }
                }
            }

            if (isset($data['software']) && is_array($data['software'])) {
                foreach ($data['software'] as $softwareData) {
                    if (!empty($softwareData['bypass_inventory'])) {
                        $this->createSoftwareManual($hardware, $softwareData, $employeeId);
                    } else {
                        $this->createSoftware($hardware, $softwareData, $employeeId);
                    }
                }
            }

            return $this->hardwareRepository->findEntityWithRelations($hardware->id);
        });
    }

    public function updateHardware(int $hardwareId, array $data, int $employeeId): Hardware
    {
        return DB::transaction(function () use ($hardwareId, $data, $employeeId) {
            $hardwareData = $this->prepareHardwareData($data, $employeeId, false);

            if (!empty($hardwareData['hostname'])) {
                $this->validateHostnameUniquenessForUpdate($hardwareData['hostname'], $hardwareId);
            }

            $issuedTo = $this->extractIssuedTo($data);

            $this->hardwareRepository->updateHardware($hardwareId, $hardwareData);

            $hardware = $this->hardwareRepository->findEntityById($hardwareId);

            if ($issuedTo !== null) {
                $this->syncAssignedUsers($hardware, $issuedTo, $employeeId);
            }

            if (isset($data['parts'])) {
                $this->processParts($hardware, $data['parts'], $employeeId);
            }

            if (isset($data['software'])) {
                $this->processSoftware($hardware, $data['software'], $employeeId);
            }

            return $this->hardwareRepository->findEntityWithRelations($hardwareId);
        });
    }

    private function extractIssuedTo(array &$data): ?array
    {
        $key = 'assignedUsersIds';

        if (!array_key_exists($key, $data)) {
            return null;
        }

        $issuedTo = $data[$key] ?? [];
        unset($data[$key]);

        return is_array($issuedTo) ? $issuedTo : [];
    }

    /**
     * Prepare hardware data
     */
    public function prepareHardwareData(array $data, int $employeeId, bool $isCreate): array
    {
        $hardwareData = [
            'hostname'     => $data['hostname'] ?? null,
            'category'     => $data['category'] ?? null,
            'brand'        => $data['brand'] ?? null,
            'model'        => $data['model'] ?? null,
            'serial_number' => $data['serial_number'] ?? null,
            'ip_address'   => $data['ip_address'] ?? null,
            'wifi_mac'     => $data['wifi_mac'] ?? null,
            'lan_mac'      => $data['lan_mac'] ?? null,
            'location'     => $data['location'] ?? null,
            'department'   => $data['department'] ?? null,
            'prodline'     => $data['prodline'] ?? null,
            'station'      => $data['station'] ?? null,
            'issued_to'    => $data['issued_to'] ?? null,
            'installed_by' => $data['installed_by'] ?? null,
            'date_issued'  => $data['date_issued'] ?? null,
            'remarks'      => $data['remarks'] ?? null,
            'status'       => $data['status'] ?? null,
        ];

        if ($isCreate) {
            $hardwareData['created_by'] = $employeeId;
        }

        $hardwareData['updated_by'] = $employeeId;

        return array_filter($hardwareData, fn($value) => $value !== null);
    }

    /**
     * Sync assigned users for hardware
     */
    public function syncAssignedUsers(Hardware $hardware, array $userIds, int $employeeId): void
    {
        $currentUserIds = $this->hardwareRepository->getAssignedUserIds($hardware->id);

        $toAdd    = array_diff($userIds, $currentUserIds);
        $toRemove = array_diff($currentUserIds, $userIds);

        if (!empty($toRemove)) {
            $this->hardwareRepository->removeAssignedUsers($hardware->id, $toRemove);
        }

        foreach ($toAdd as $userId) {
            $this->hardwareRepository->assignUser($hardware->id, $userId, $employeeId);
        }
    }

    /**
     * Process hardware software (create, update, delete)
     */
  public function processSoftware(Hardware $hardware, array $softwareList, int $employeeId): void
{
    foreach ($softwareList as $softwareData) {
        if (isset($softwareData['_delete']) && $softwareData['_delete'] === true) {
            $this->deleteSoftware($hardware, $softwareData, $employeeId);
        } elseif (isset($softwareData['id']) && !empty($softwareData['bypass_inventory'])) {
            // Update the software inventory record itself
            $this->updateSoftwareManual($softwareData, $employeeId);
        } elseif (isset($softwareData['id'])) {
            $this->updateSoftware($softwareData, $employeeId);
        } elseif (!empty($softwareData['bypass_inventory'])) {
            $this->createSoftwareManual($hardware, $softwareData, $employeeId);
        } else {
            $this->createSoftware($hardware, $softwareData, $employeeId);
        }
    }
}

    /**
     * Create a new software installation
     */
    public function createSoftware(Hardware $hardware, array $softwareData, int $employeeId): void
    {
        $this->createSoftwareAndReturn($hardware, $softwareData, $employeeId);
    }

    /**
     * Create a new software installation and return the created record
     */
    private function createSoftwareAndReturn($entity, array $softwareData, int $employeeId)
    {
        $softwareInventory = $this->hardwareRepository->findSoftwareInventory(
            $softwareData['software_name'],
            $softwareData['software_type'],
            $softwareData['version']
        );

        if (!$softwareInventory) {
            throw new \Exception(
                "Software not found: {$softwareData['software_name']} {$softwareData['software_type']} v{$softwareData['version']}"
            );
        }

        $licenseId = null;
        if ($softwareInventory->requires_key_tracking) {
            $license   = $this->findAndIncrementLicense($softwareData, $entity, $employeeId);
            $licenseId = $license->id;
        }

        $hardwareSoftwareData = [
            'hardware_id'           => $entity->id,
            'software_inventory_id' => $softwareInventory->id,
            'software_license_id'   => $licenseId,
            'installation_date'     => now(),
            'installed_by'          => $employeeId,
            'status'                => 'Active',
        ];

        $hardwareSoftware = $this->hardwareRepository->createHardwareSoftware($hardwareSoftwareData);

        $this->hardwareRepository->logHardwareSoftwareChange(
            $entity,
            $hardwareSoftware,
            'software_installed',
            $employeeId,
            "Installed {$softwareInventory->software_name} ({$softwareInventory->software_type}) v{$softwareInventory->version}"
        );

        Log::info("Created software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'entity_name'          => $entity->hostname ?? $entity->printer_name,
            'software_name'        => $softwareData['software_name'],
            'license_id'           => $licenseId,
            'installed_by'         => $employeeId,
        ]);

        return $hardwareSoftware;
    }

    /**
     * Update software installation
     */
    public function updateSoftware(array $softwareData, int $employeeId): void
    {
        $hardwareSoftware = $this->hardwareRepository->findHardwareSoftwareById($softwareData['id']);

        if (!$hardwareSoftware) {
            throw new \Exception("Hardware software not found: {$softwareData['id']}");
        }
    //   dd($softwareData);
        $updateData = [
          
            'remarks' => $softwareData['remarks'] ?? $hardwareSoftware->remarks,
        ];
  
        $this->hardwareRepository->updateHardwareSoftware($hardwareSoftware->id, $updateData);

        Log::info("Updated software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'updated_by'           => $employeeId,
        ]);
    }
 public function updateSoftwareManual(array $softwareData, int $employeeId): void
{
    // Find the HardwareSoftware pivot to get software_inventory_id
    $hardwareSoftware = $this->hardwareRepository->findHardwareSoftwareById($softwareData['id']);

    if (!$hardwareSoftware) {
        throw new \Exception("Hardware software not found: {$softwareData['id']}");
    }

    // Update the actual SoftwareInventory record
    $updateData = array_filter([
        'software_name' => $softwareData['software_name'] ?? null,
        'software_type' => $softwareData['software_type'] ?? null,
        'version'       => $softwareData['version']       ?? null,
    ], fn($v) => $v !== null);

    $this->hardwareRepository->updateSoftwareInventory(
        $hardwareSoftware->software_inventory_id,
        $updateData
    );

    Log::info("Updated software inventory (manual)", [
        'hardware_software_id'  => $hardwareSoftware->id,
        'software_inventory_id' => $hardwareSoftware->software_inventory_id,
        'updated_fields'        => $updateData,
        'updated_by'            => $employeeId,
    ]);
}
    /**
     * Delete software installation and decrement license activation
     */
    public function deleteSoftware($entity, array $softwareData, int $employeeId): void
    {
        $hardwareSoftware = $this->hardwareRepository->findHardwareSoftwareById($softwareData['id']);

        if (!$hardwareSoftware) {
            throw new \Exception("Hardware software not found: {$softwareData['id']}");
        }

        $hardwareSoftware->loadMissing(['softwareInventory', 'softwareLicense']);

        $softwareInventory = $hardwareSoftware->softwareInventory;
        $softwareName      = $softwareInventory
            ? "{$softwareInventory->software_name} ({$softwareInventory->software_type}) v{$softwareInventory->version}"
            : 'Unknown Software';

        $removalReason = $softwareData['removal_reason'] ?? 'Uninstalled from hardware';

        $this->hardwareRepository->logHardwareSoftwareChange(
            $entity,
            $hardwareSoftware,
            'software_uninstalled',
            $employeeId,
            "Uninstalled {$softwareName}. Reason: {$removalReason}"
        );

        if ($hardwareSoftware->software_license_id) {
            $license = $this->hardwareRepository->findSoftwareLicense($hardwareSoftware->software_license_id);

            if ($license && $license->current_activations > 0) {
                $entityName = $entity->hostname ?? $entity->printer_name ?? $entity->id;
                $reason     = "Uninstalled {$softwareName} from: {$entityName}. Reason: {$removalReason}";
                $this->hardwareRepository->decrementLicenseActivation($license->id, 1, $reason, $employeeId);

                Log::info("Decremented license activation", [
                    'license_id'          => $license->id,
                    'software_license_id' => $hardwareSoftware->software_license_id,
                    'entity'              => $entityName,
                ]);
            }
        }

        $remarks = $this->buildRemovalRemarks($softwareData);

        $this->hardwareRepository->updateHardwareSoftware($hardwareSoftware->id, [
            'status'         => 'Uninstalled',
            'uninstall_date' => now(),
            'remarks'        => $remarks,
        ]);

        $this->hardwareRepository->deleteHardwareSoftware($hardwareSoftware->id);

        Log::info("Deleted software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'removal_reason'       => $softwareData['removal_reason'] ?? 'N/A',
            'deleted_by'           => $employeeId,
        ]);
    }

    /**
     * Find license and increment activation count
     */
    public function findAndIncrementLicense(array $softwareData, $entity, int $employeeId)
    {
        $licenseKey  = $softwareData['license_key'] ?? null;
        $accountUser = $softwareData['account_user'] ?? null;

        if (!$licenseKey && !$accountUser) {
            throw new \Exception("No license identifier provided");
        }

        $license = $this->hardwareRepository->findSoftwareLicenseByIdentifier($licenseKey, $accountUser);

        if (!$license) {
            throw new \Exception(
                "License not found using " . ($licenseKey ? "license key" : "account user")
            );
        }

        if ($license->current_activations >= $license->max_activations) {
            throw new \Exception(
                "License has reached maximum activations ({$license->max_activations})"
            );
        }

        $softwareName = $softwareData['software_name'] ?? 'Software';
        $entityName   = $entity->hostname ?? $entity->printer_name ?? $entity->id;
        $reason       = "Activated license for {$softwareName} on: {$entityName}";

        $this->hardwareRepository->incrementLicenseActivation($license->id, 1, $reason, $employeeId);

        Log::info("Incremented license activation", [
            'license_id'  => $license->id,
            'license_key' => $license->license_key,
            'entity'      => $entityName,
        ]);

        return $license;
    }

    /**
     * Map removal condition to inventory condition
     */
    public function mapRemovalConditionToInventoryCondition(string $removalCondition): string
    {
        $mapping = [
            'working'   => 'Working',
            'faulty'    => 'Used',
            'defective' => 'Defective',
            'damaged'   => 'Damaged',
        ];

        return $mapping[strtolower($removalCondition)] ?? 'Working';
    }

    /**
     * Build removal remarks from removal data
     */
    public function buildRemovalRemarks(array $removalData): string
    {
        $parts = [];

        if (!empty($removalData['removal_reason'])) {
            $parts[] = "Reason: {$removalData['removal_reason']}";
        }

        if (!empty($removalData['removal_condition'])) {
            $parts[] = "Condition: {$removalData['removal_condition']}";
        }

        if (!empty($removalData['removal_remarks'])) {
            $parts[] = "Remarks: {$removalData['removal_remarks']}";
        }

        return implode(' | ', $parts);
    }

    /**
     * Add component to hardware/printer
     */
    public function addComponent(array $data): mixed
    {
        return DB::transaction(function () use ($data) {
            $hardwareId    = $data['hardware_id'];
            $componentType = $data['component_type'];
            $entityType    = $data['entity_type'] ?? 'hardware';
            $employeeId    = $data['employee_id'];

            $this->currentEntityType = $entityType;

            $hardware = $this->hardwareRepository->findEntityById($hardwareId, $entityType);

            if (!$hardware) {
                throw new \Exception("Entity not found");
            }

            $newComponentId = null;
            $componentName  = '';

            if ($componentType === 'part') {
                $partData = [
                    'part_type'      => $data['new_part_type'],
                    'brand'          => $data['new_brand'],
                    'model'          => $data['new_model'],
                    'specifications' => $data['new_specifications'],
                    'condition'      => $data['new_condition'] ?? 'New',
                    'serial_number'  => $data['new_serial_number'] ?? null,
                ];

                $createdPart    = $this->createPartAndReturn($hardware, $partData, $employeeId);
                $newComponentId = $createdPart->id;
                $componentName  = "{$partData['part_type']} - {$partData['brand']} {$partData['model']}";
            } else {
                $softwareData = [
                    'software_name'    => $data['new_software_name'],
                    'software_type'    => $data['new_software_type'],
                    'version'          => $data['new_version'],
                    'license_key'      => $data['new_license_key'] ?? null,
                    'account_user'     => $data['new_account_user'] ?? null,
                    'account_password' => $data['new_account_password'] ?? null,
                ];

                $createdSoftware = $this->createSoftwareAndReturn($hardware, $softwareData, $employeeId);
                $newComponentId  = $createdSoftware->id;
                $componentName   = "{$softwareData['software_name']} ({$softwareData['software_type']})";
            }

            return $this->hardwareRepository->findEntityWithRelations($hardwareId, $entityType);
        });
    }

    /**
     * Remove component from hardware/printer
     */
    public function removeComponent(array $data): mixed
    {
        return DB::transaction(function () use ($data) {
            $hardwareId    = $data['hardware_id'];
            $entityType    = $data['entity_type'] ?? 'hardware';
            $componentId   = $data['component_id'];
            $componentType = $data['component_type'];
            $employeeId    = $data['employee_id'];

            $this->currentEntityType = $entityType;

            $hardware = $this->hardwareRepository->findEntityById($hardwareId, $entityType);

            if (!$hardware) {
                throw new \Exception("Entity not found");
            }

            if ($componentType === 'part') {
                $partData = [
                    'id'                => $componentId,
                    'removal_reason'    => $data['removal_reason'],
                    'removal_condition' => $data['removal_condition'],
                    'removal_remarks'   => $data['removal_remarks'] ?? null,
                ];

                $this->deletePart($hardware, $partData, $employeeId);

                Log::info("Removed part from entity", [
                    'entity_id'       => $hardware->id,
                    'entity_type'     => $entityType,
                    'part_id'         => $componentId,
                    'removal_reason'  => $data['removal_reason'],
                    'removed_by'      => $employeeId,
                ]);
            } else {
                $softwareData = [
                    'id'                => $componentId,
                    'removal_reason'    => $data['removal_reason'],
                    'removal_condition' => $data['removal_condition'],
                    'removal_remarks'   => $data['removal_remarks'] ?? null,
                ];

                $this->deleteSoftware($hardware, $softwareData, $employeeId);

                Log::info("Removed software from entity", [
                    'entity_id'      => $hardware->id,
                    'entity_type'    => $entityType,
                    'software_id'    => $componentId,
                    'removal_reason' => $data['removal_reason'],
                    'removed_by'     => $employeeId,
                ]);
            }

            return $this->hardwareRepository->findEntityWithRelations($hardwareId, $entityType);
        });
    }

    /**
     * Replace component on hardware/printer
     */
    public function replaceComponent(array $data): mixed
    {
        return DB::transaction(function () use ($data) {
            $hardwareId    = $data['hardware_id'];
            $entityType    = $data['entity_type'] ?? 'hardware';
            $componentId   = $data['component_id'];
            $componentType = $data['component_type'];
            $employeeId    = $data['employee_id'];

            $this->currentEntityType = $entityType;

            $hardware = $this->hardwareRepository->findEntityById($hardwareId, $entityType);

            if (!$hardware) {
                throw new \Exception("Entity not found");
            }

            $newComponentId = null;

            if ($componentType === 'part') {
                $oldPart     = $this->hardwareRepository->findEntityPartById($componentId, $entityType);
                $oldItemName = $oldPart
                    ? "{$oldPart->part_type} - {$oldPart->brand} {$oldPart->model}"
                    : "Unknown Part";

                $removalData = [
                    'id'                => $componentId,
                    'removal_reason'    => $data['reason'] ?? 'Component replacement',
                    'removal_condition' => $data['old_component_condition'] ?? 'working',
                    'removal_remarks'   => $data['remarks'] ?? null,
                ];

                $this->deletePart($hardware, $removalData, $employeeId);

                $newPartData = [
                    'part_type'      => $data['replacement_part_type'],
                    'brand'          => $data['replacement_brand'],
                    'model'          => $data['replacement_model'],
                    'specifications' => $data['replacement_specifications'] ?? '',
                    'condition'      => $data['replacement_condition'] ?? 'New',
                    'serial_number'  => $data['replacement_serial_number'] ?? null,
                ];

                $createdPart    = $this->createPartAndReturn($hardware, $newPartData, $employeeId);
                $newComponentId = $createdPart->id;
            } else {
                $oldSoftware = $this->hardwareRepository->findHardwareSoftwareById($componentId);
                $oldItemName = 'Unknown Software';

                if ($oldSoftware) {
                    $oldSoftware->loadMissing('softwareInventory');
                    if ($oldSoftware->softwareInventory) {
                        $oldItemName = "{$oldSoftware->softwareInventory->software_name} ({$oldSoftware->softwareInventory->software_type})";
                    }
                }

                $removalData = [
                    'id'                => $componentId,
                    'removal_reason'    => $data['reason'] ?? 'Software replacement',
                    'removal_condition' => 'N/A',
                    'removal_remarks'   => $data['remarks'] ?? null,
                ];

                $this->deleteSoftware($hardware, $removalData, $employeeId);

                $newSoftwareData = [
                    'software_name'    => $data['replacement_sw_software_name'],
                    'software_type'    => $data['replacement_sw_software_type'],
                    'version'          => $data['replacement_sw_version'],
                    'license_key'      => $data['replacement_sw_license_key'] ?? null,
                    'account_user'     => $data['replacement_sw_account_user'] ?? null,
                    'account_password' => $data['replacement_sw_account_password'] ?? null,
                ];

                $createdSoftware = $this->createSoftwareAndReturn($hardware, $newSoftwareData, $employeeId);
                $newComponentId  = $createdSoftware->id;
            }

            return $this->hardwareRepository->findEntityWithRelations($hardwareId, $entityType);
        });
    }

    /**
     * Create hardware software bypassing license / inventory.
     */
    public function createSoftwareManual($entity, array $softwareData, int $employeeId): void
    {
        $this->hardwareRepository->createHardwareSoftwareManual($entity, $softwareData, $employeeId);

        Log::info('Created software (manual / no inventory)', [
            'entity_name'   => $entity->hostname ?? $entity->printer_name,
            'software_name' => $softwareData['software_name'],
            'created_by'    => $employeeId,
        ]);
    }
    /**
     * Resolve hostname for creation:
     * - If provided, check it's not taken by an active hardware
     * - If empty, auto-generate based on category pattern
     */
    private function resolveHostnameForCreate(?string $hostname, ?string $category): string
    {
        if (!empty($hostname)) {
            if ($this->hardwareRepository->activeHostnameExists($hostname)) {
                throw new \Exception("A hardware with hostname '{$hostname}' is already active.");
            }
            return $hostname;
        }

        return $this->generateHostname($category);
    }

    /**
     * Validate hostname is not taken by another active hardware (excluding current)
     */
    private function validateHostnameUniquenessForUpdate(string $hostname, int $excludeId): void
    {
        if ($this->hardwareRepository->activeHostnameExistsExcluding($hostname, $excludeId)) {
            throw new \Exception("A hardware with hostname '{$hostname}' is already active.");
        }
    }

    /**
     * Generate the next available hostname based on category.
     *
     * Desktop         → TSPI-PC-XXX   (e.g. TSPI-PC-001)
     * Laptop          → TSPI-LAP-XXX  (e.g. TSPI-LAP-001)
     * Promis Terminal → TELFORD-WXXX  (e.g. TELFORD-W001)
     */
    private function generateHostname(?string $category): string
    {
        $prefixMap = [
            'Desktop'         => 'TSPI-PC-',
            'Laptop'          => 'TSPI-LAP-',
            'Promis Terminal' => 'TELFORD-W',
        ];

        $prefix = $prefixMap[$category] ?? strtoupper(str_replace(' ', '-', $category ?? 'HW')) . '-';

        $nextNumber = $this->hardwareRepository->getNextHostnameNumber($prefix);

        return $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
}
