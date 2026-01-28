<?php

namespace App\Services;

use App\Repositories\HardwareRepository;
use App\Models\Hardware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HardwareUpdateService
{
    protected HardwareRepository $hardwareRepository;

    public function __construct(HardwareRepository $hardwareRepository)
    {
        $this->hardwareRepository = $hardwareRepository;
    }

    /**
     * Create new hardware with parts and software
     * BUSINESS LOGIC: Orchestrate creation with inventory management
     */
    public function createHardware(array $data, int $employeeId): Hardware
    {
        return DB::transaction(function () use ($data, $employeeId) {
            // BUSINESS LOGIC: Prepare hardware data
            $hardwareData = $this->prepareHardwareData($data, $employeeId, true);

            // REPO: Create hardware record
            $hardware = $this->hardwareRepository->createHardware($hardwareData);

            Log::info("Hardware created", [
                'hardware_id' => $hardware->id,
                'hostname' => $hardware->hostname,
                'created_by' => $employeeId,
            ]);

            // BUSINESS LOGIC: Process parts if provided
            if (isset($data['parts']) && is_array($data['parts'])) {
                foreach ($data['parts'] as $partData) {
                    $this->createPart($hardware, $partData, $employeeId);
                }
            }

            // BUSINESS LOGIC: Process software if provided
            if (isset($data['software']) && is_array($data['software'])) {
                foreach ($data['software'] as $softwareData) {
                    $this->createSoftware($hardware, $softwareData, $employeeId);
                }
            }

            // REPO: Reload with relationships
            return $this->hardwareRepository->findWithRelations($hardware->id);
        });
    }

    /**
     * Update hardware with parts and software
     * BUSINESS LOGIC: Orchestrate update with inventory management
     */
    public function updateHardware(int $hardwareId, array $data, int $employeeId): Hardware
    {
        return DB::transaction(function () use ($hardwareId, $data, $employeeId) {
            // REPO: Find hardware
            $hardware = $this->hardwareRepository->findById($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            // BUSINESS LOGIC: Prepare hardware data
            $hardwareData = $this->prepareHardwareData($data, $employeeId, false);

            // REPO: Update hardware record
            $this->hardwareRepository->updateHardware($hardware->id, $hardwareData);

            Log::info("Hardware updated", [
                'hardware_id' => $hardware->id,
                'hostname' => $hardware->hostname,
                'updated_by' => $employeeId,
            ]);

            // BUSINESS LOGIC: Process parts if provided
            if (isset($data['parts'])) {
                $this->processParts($hardware, $data['parts'], $employeeId);
            }

            // BUSINESS LOGIC: Process software if provided
            if (isset($data['software'])) {
                $this->processSoftware($hardware, $data['software'], $employeeId);
            }

            // REPO: Reload with relationships
            return $this->hardwareRepository->findWithRelations($hardware->id);
        });
    }

    /**
     * Prepare hardware data
     * BUSINESS LOGIC: Data preparation and validation
     */
    protected function prepareHardwareData(array $data, int $employeeId, bool $isCreate): array
    {
        $hardwareData = [
            'hostname' => $data['hostname'] ?? null,
            'category' => $data['category'] ?? null,
            'brand' => $data['brand'] ?? null,
            'model' => $data['model'] ?? null,
            'serial_number' => $data['serial_number'] ?? null,
            'processor' => $data['processor'] ?? null,
            'motherboard' => $data['motherboard'] ?? null,
            'ip_address' => $data['ip_address'] ?? null,
            'wifi_mac' => $data['wifi_mac'] ?? null,
            'lan_mac' => $data['lan_mac'] ?? null,
            'location' => $data['location'] ?? null,
            'department' => $data['department'] ?? null,
            'issued_to' => $data['issued_to'] ?? null,
            'installed_by' => $data['installed_by'] ?? null,
            'date_issued' => $data['date_issued'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'status' => $data['status'] ?? null,
        ];

        if ($isCreate) {
            $hardwareData['created_by'] = $employeeId;
        }

        $hardwareData['updated_by'] = $employeeId;

        // Remove null values
        return array_filter($hardwareData, fn($value) => $value !== null);
    }

    /**
     * Process hardware parts (create, update, delete)
     * BUSINESS LOGIC: Orchestrate part operations
     */
    protected function processParts(Hardware $hardware, array $parts, int $employeeId): void
    {
        foreach ($parts as $partData) {
            if (isset($partData['_delete']) && $partData['_delete'] === true) {
                // DELETE scenario
                $this->deletePart($hardware, $partData, $employeeId);
            } elseif (isset($partData['id'])) {
                // UPDATE scenario
                $this->updatePart($partData, $employeeId);
            } else {
                // CREATE scenario
                $this->createPart($hardware, $partData, $employeeId);
            }
        }
    }

    /**
     * Create a new hardware part and update inventory
     * BUSINESS LOGIC: Part creation with inventory management
     * ENHANCED: Now passes context to inventory decrement
     */
    protected function createPart(Hardware $hardware, array $partData, int $employeeId): void
    {
        // REPO: Find the Part record
        $part = $this->hardwareRepository->findPart(
            $partData['part_type'],
            $partData['brand'],
            $partData['model'],
            $partData['specifications']
        );

        if (!$part) {
            throw new \Exception(
                "Part not found: {$partData['part_type']} - {$partData['brand']} {$partData['model']}"
            );
        }

        // REPO: Find available inventory
        $inventory = $this->hardwareRepository->findAvailablePartInventory($part->id);

        if (!$inventory) {
            throw new \Exception(
                "No available inventory for {$part->part_type} - {$part->brand} {$part->model}"
            );
        }

        // REPO: Decrement inventory WITH CONTEXT
        $reason = "Installed on hardware: {$hardware->hostname} ({$hardware->category})";
        $this->hardwareRepository->decrementInventory($inventory->id, 1, $reason, $employeeId);

        // REPO: Create hardware part record
        $hardwarePartData = [
            'hardware_id' => $hardware->hostname,
            'part_type' => $partData['part_type'],
            'brand' => $partData['brand'],
            'model' => $partData['model'],
            'specifications' => $partData['specifications'],
            'serial_number' => $partData['serial_number'] ?? null,
            'source_inventory_id' => $inventory->id,
            'status' => 'installed',
            'installed_date' => now(),
            'created_by' => $employeeId,
        ];

        $hardwarePart = $this->hardwareRepository->createHardwarePart($hardwarePartData);

        Log::info("Created hardware part", [
            'hardware_part_id' => $hardwarePart->id,
            'hardware_id' => $hardware->hostname,
            'part_type' => $partData['part_type'],
            'inventory_id' => $inventory->id,
            'created_by' => $employeeId,
        ]);
    }

    /**
     * Update an existing hardware part
     * BUSINESS LOGIC: Part update logic
     */
    protected function updatePart(array $partData, int $employeeId): void
    {
        // REPO: Find hardware part
        $hardwarePart = $this->hardwareRepository->findHardwarePartById($partData['id']);

        if (!$hardwarePart) {
            throw new \Exception("Hardware part not found: {$partData['id']}");
        }

        // BUSINESS LOGIC: Prepare update data (only allowed fields)
        $updateData = [
            'serial_number' => $partData['serial_number'] ?? $hardwarePart->serial_number,
            'remarks' => $partData['remarks'] ?? $hardwarePart->remarks,
            'updated_by' => $employeeId,
        ];

        // REPO: Update hardware part
        $this->hardwareRepository->updateHardwarePart($hardwarePart->id, $updateData);

        Log::info("Updated hardware part", [
            'hardware_part_id' => $hardwarePart->id,
            'updated_by' => $employeeId,
        ]);
    }

    /**
     * Delete a hardware part and return it to inventory
     * BUSINESS LOGIC: Part deletion with inventory return
     * ENHANCED: Now passes context to inventory increment
     */
    protected function deletePart(Hardware $hardware, array $partData, int $employeeId): void
    {
        // REPO: Find hardware part
        $hardwarePart = $this->hardwareRepository->findHardwarePartById($partData['id']);

        if (!$hardwarePart) {
            throw new \Exception("Hardware part not found: {$partData['id']}");
        }

        // REPO: Find the Part record
        $part = $this->hardwareRepository->findPart(
            $hardwarePart->part_type,
            $hardwarePart->brand,
            $hardwarePart->model,
            $hardwarePart->specifications
        );

        if (!$part) {
            throw new \Exception("Part not found for hardware part ID: {$hardwarePart->id}");
        }

        // BUSINESS LOGIC: Determine condition
        $condition = $this->mapRemovalConditionToInventoryCondition(
            $partData['removal_condition'] ?? 'Working'
        );

        // REPO: Find or create inventory record for this condition
        $inventory = $this->hardwareRepository->findOrCreatePartInventory($part->id, $condition);

        // REPO: Increment inventory WITH CONTEXT
        $removalReason = $partData['removal_reason'] ?? 'Removed from hardware';
        $reason = "Removed from hardware: {$hardware->hostname}. Reason: {$removalReason}. Condition: {$condition}";
        $this->hardwareRepository->incrementInventory($inventory->id, 1, $reason, $employeeId);

        // BUSINESS LOGIC: Build removal remarks
        $remarks = $this->buildRemovalRemarks($partData);

        // REPO: Update hardware part record before deletion
        $this->hardwareRepository->updateHardwarePart($hardwarePart->id, [
            'status' => 'Removed',
            'removed_date' => now(),
            'remarks' => $remarks,
            'updated_by' => $employeeId,
        ]);

        // REPO: Delete the record
        $this->hardwareRepository->deleteHardwarePart($hardwarePart->id);

        Log::info("Deleted hardware part and returned to inventory", [
            'hardware_part_id' => $hardwarePart->id,
            'part_id' => $part->id,
            'inventory_id' => $inventory->id,
            'condition' => $condition,
            'removal_reason' => $removalReason,
            'deleted_by' => $employeeId,
        ]);
    }

    /**
     * Process hardware software (create, update, delete)
     * BUSINESS LOGIC: Orchestrate software operations
     */
    protected function processSoftware(Hardware $hardware, array $softwareList, int $employeeId): void
    {
        foreach ($softwareList as $softwareData) {
            if (isset($softwareData['_delete']) && $softwareData['_delete'] === true) {
                // DELETE scenario
                $this->deleteSoftware($hardware, $softwareData, $employeeId);
            } elseif (isset($softwareData['id'])) {
                // UPDATE scenario
                $this->updateSoftware($softwareData, $employeeId);
            } else {
                // CREATE scenario
                $this->createSoftware($hardware, $softwareData, $employeeId);
            }
        }
    }

    /**
     * Create a new software installation
     * BUSINESS LOGIC: Software installation with license management
     * ENHANCED: Now passes context to license increment
     */
    protected function createSoftware(Hardware $hardware, array $softwareData, int $employeeId): void
    {
        // REPO: Find software inventory
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

        // BUSINESS LOGIC: Handle license if required
        $licenseId = null;
        if ($softwareInventory->requires_key_tracking) {
            $license = $this->findAndIncrementLicense($softwareData, $hardware, $employeeId);
            $licenseId = $license->id;
        }

        // REPO: Create hardware software record
        $hardwareSoftwareData = [
            'hardware_id' => $hardware->hostname,
            'software_inventory_id' => $softwareInventory->id,
            'software_license_id' => $licenseId,
            'installation_date' => now(),
            'installed_by' => $employeeId,
            'status' => 'Active',
        ];

        $hardwareSoftware = $this->hardwareRepository->createHardwareSoftware($hardwareSoftwareData);

        Log::info("Created software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'hardware_id' => $hardware->hostname,
            'software_name' => $softwareData['software_name'],
            'license_id' => $licenseId,
            'installed_by' => $employeeId,
        ]);
    }

    /**
     * Update software installation
     * BUSINESS LOGIC: Software update logic
     */
    protected function updateSoftware(array $softwareData, int $employeeId): void
    {
        // REPO: Find hardware software
        $hardwareSoftware = $this->hardwareRepository->findHardwareSoftwareById($softwareData['id']);

        if (!$hardwareSoftware) {
            throw new \Exception("Hardware software not found: {$softwareData['id']}");
        }

        // BUSINESS LOGIC: Prepare update data
        $updateData = [
            'remarks' => $softwareData['remarks'] ?? $hardwareSoftware->remarks,
        ];

        // REPO: Update hardware software
        $this->hardwareRepository->updateHardwareSoftware($hardwareSoftware->id, $updateData);

        Log::info("Updated software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'updated_by' => $employeeId,
        ]);
    }

    /**
     * Delete software installation and decrement license activation
     * BUSINESS LOGIC: Software uninstallation with license release
     * ENHANCED: Now passes context to license decrement
     */
    protected function deleteSoftware(Hardware $hardware, array $softwareData, int $employeeId): void
    {
        // REPO: Find hardware software
        $hardwareSoftware = $this->hardwareRepository->findHardwareSoftwareById($softwareData['id']);

        if (!$hardwareSoftware) {
            throw new \Exception("Hardware software not found: {$softwareData['id']}");
        }

        // Load relationships
        $hardwareSoftware->loadMissing('softwareInventory');

        // BUSINESS LOGIC: Decrement license activation if applicable WITH CONTEXT
        if ($hardwareSoftware->software_license_id) {
            $license = $this->hardwareRepository->findSoftwareLicense($hardwareSoftware->software_license_id);

            if ($license && $license->current_activations > 0) {
                $removalReason = $softwareData['removal_reason'] ?? 'Uninstalled from hardware';
                $softwareName = $hardwareSoftware->softwareInventory
                    ? $hardwareSoftware->softwareInventory->software_name
                    : 'Unknown Software';

                $reason = "Uninstalled {$softwareName} from hardware: {$hardware->hostname}. Reason: {$removalReason}";

                // REPO: Decrement activation WITH CONTEXT
                $this->hardwareRepository->decrementLicenseActivation($license->id, 1, $reason, $employeeId);

                Log::info("Decremented license activation", [
                    'license_id' => $license->id,
                    'software_license_id' => $hardwareSoftware->software_license_id,
                    'hardware' => $hardware->hostname,
                ]);
            }
        }

        // BUSINESS LOGIC: Build removal remarks
        $remarks = $this->buildRemovalRemarks($softwareData);

        // REPO: Update hardware software record before deletion
        $this->hardwareRepository->updateHardwareSoftware($hardwareSoftware->id, [
            'status' => 'Uninstalled',
            'uninstall_date' => now(),
            'remarks' => $remarks,
        ]);

        // REPO: Delete the record
        $this->hardwareRepository->deleteHardwareSoftware($hardwareSoftware->id);

        Log::info("Deleted software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'removal_reason' => $softwareData['removal_reason'] ?? 'N/A',
            'deleted_by' => $employeeId,
        ]);
    }

    /**
     * Find license and increment activation count
     * BUSINESS LOGIC: License activation logic
     * ENHANCED: Now passes context to license increment
     */
    protected function findAndIncrementLicense(array $softwareData, Hardware $hardware, int $employeeId)
    {
        // BUSINESS LOGIC: Determine identifier type
        $licenseKey = $softwareData['license_key'] ?? null;
        $accountUser = $softwareData['account_user'] ?? null;

        if (!$licenseKey && !$accountUser) {
            throw new \Exception("No license identifier provided");
        }

        // REPO: Find license
        $license = $this->hardwareRepository->findSoftwareLicenseByIdentifier($licenseKey, $accountUser);

        if (!$license) {
            throw new \Exception("License not found");
        }

        // BUSINESS LOGIC: Check activation limit
        if ($license->current_activations >= $license->max_activations) {
            throw new \Exception(
                "License has reached maximum activations ({$license->max_activations})"
            );
        }

        // Build context reason
        $softwareName = $softwareData['software_name'] ?? 'Software';
        $reason = "Activated license for {$softwareName} on hardware: {$hardware->hostname} ({$hardware->category})";

        // REPO: Increment activation count WITH CONTEXT
        $this->hardwareRepository->incrementLicenseActivation($license->id, 1, $reason, $employeeId);

        Log::info("Incremented license activation", [
            'license_id' => $license->id,
            'license_key' => $license->license_key,
            'hardware' => $hardware->hostname,
        ]);

        return $license;
    }

    /**
     * Map removal condition to inventory condition
     * BUSINESS LOGIC: Condition mapping logic
     */
    protected function mapRemovalConditionToInventoryCondition(string $removalCondition): string
    {
        $mapping = [
            'working' => 'Working',
            'partially_working' => 'Defective',
            'defective' => 'Defective',
            'unknown' => 'Unknown',

        ];

        return $mapping[$removalCondition] ?? 'Working';
    }

    /**
     * Build removal remarks from removal data
     * BUSINESS LOGIC: Remarks formatting
     */
    protected function buildRemovalRemarks(array $removalData): string
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
}
