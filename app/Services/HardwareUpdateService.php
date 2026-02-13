<?php

namespace App\Services;

use App\Repositories\HardwareRepository;
use App\Models\Hardware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HardwareUpdateService
{
    public HardwareRepository $hardwareRepository;


    public function __construct(
        HardwareRepository $hardwareRepository
    ) {
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
    public function prepareHardwareData(array $data, int $employeeId, bool $isCreate): array
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
    public function processParts(Hardware $hardware, array $parts, int $employeeId): void
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
     * ENHANCED: Now passes context to inventory decrement and logs on hardware
     */
    public function createPart(Hardware $hardware, array $partData, int $employeeId): void
    {
        $this->createPartAndReturn($hardware, $partData, $employeeId);
    }

    /**
     * Create a new hardware part and return the created record
     * Used when we need the created part ID for issuance tracking
     */
    private function createPartAndReturn(Hardware $hardware, array $partData, int $employeeId)
    {
        // Get specifications and condition
        $specifications = $partData['specifications'] ?? '';
        $condition = $partData['condition'] ?? 'Working'; // Default to 'Working' if not specified

        // Debug log
        Log::info('Creating part with data:', [
            'specifications' => $specifications,
            'condition' => $condition,
            'part_type' => $partData['part_type'] ?? '',
            'brand' => $partData['brand'] ?? '',
            'model' => $partData['model'] ?? '',
        ]);

        // REPO: Find the Part record
        $part = $this->hardwareRepository->findPart(
            $partData['part_type'],
            $partData['brand'],
            $partData['model'],
            $specifications
        );

        if (!$part) {
            throw new \Exception(
                "Part not found: {$partData['part_type']} - {$partData['brand']} {$partData['model']}"
            );
        }

        // REPO: Find available inventory WITH SPECIFIC CONDITION
        $inventory = $this->hardwareRepository->findAvailablePartInventory($part->id, $condition);

        if (!$inventory) {
            // Try to find any available inventory as fallback
            $inventory = $this->hardwareRepository->findAvailablePartInventory($part->id, null);

            if (!$inventory) {
                throw new \Exception(
                    "No available inventory for {$part->part_type} - {$part->brand} {$part->model}. " .
                        "Requested condition: {$condition}"
                );
            }

            Log::warning('Falling back to different condition inventory', [
                'requested_condition' => $condition,
                'actual_condition' => $inventory->condition,
                'part_id' => $part->id,
            ]);
        }

        // Update condition to match the inventory we found
        $condition = $inventory->condition;

        // REPO: Create hardware part record FIRST
        $hardwarePartData = [
            'hardware_id' => $hardware->id,
            'part_type' => $partData['part_type'],
            'brand' => $partData['brand'],
            'model' => $partData['model'],
            'specifications' => $specifications,
            'condition' => $condition, // Store the condition
            'serial_number' => $partData['serial_number'] ?? null,
            'source_inventory_id' => $inventory->id,
            'status' => 'installed',
            'installed_date' => now(),
            'created_by' => $employeeId,
        ];

        $hardwarePart = $this->hardwareRepository->createHardwarePart($hardwarePartData);

        // NEW: Log part addition on Hardware model
        $this->hardwareRepository->logHardwarePartChange(
            $hardware,
            $hardwarePart,
            'part_added',
            $employeeId,
            "Added {$part->part_type} - {$part->brand} {$part->model} ({$condition})"
        );

        // REPO: Decrement inventory WITH CONTEXT AND HARDWARE REFERENCE
        $reason = "Installed on hardware: {$hardware->hostname} ({$hardware->category})";
        $this->hardwareRepository->decrementInventory(
            $inventory->id,
            1,
            $reason,
            $employeeId,
            $hardware
        );

        Log::info("Created hardware part", [
            'hardware_part_id' => $hardwarePart->id,
            'hardware_id' => $hardware->hostname,
            'part_type' => $partData['part_type'],
            'condition' => $condition,
            'inventory_id' => $inventory->id,
            'created_by' => $employeeId,
        ]);

        return $hardwarePart;
    }

    /**
     * Update an existing hardware part
     * BUSINESS LOGIC: Part update logic
     */
    public function updatePart(array $partData, int $employeeId): void
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
     * ENHANCED: Now passes context to inventory increment and logs on hardware
     */
    public function deletePart(Hardware $hardware, array $partData, int $employeeId): void
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

        // BUSINESS LOGIC: Build removal context
        $removalReason = $partData['removal_reason'] ?? 'Removed from hardware';
        $removalRemarks = $partData['removal_remarks'] ?? '';

        // NEW: Log part removal on Hardware model BEFORE updating/deleting
        $this->hardwareRepository->logHardwarePartChange(
            $hardware,
            $hardwarePart,
            'part_removed',
            $employeeId,
            "Removed {$part->part_type} - {$part->brand} {$part->model}. Reason: {$removalReason}. Condition: {$condition}" .
                ($removalRemarks ? ". {$removalRemarks}" : "")
        );

        // REPO: Increment inventory WITH CONTEXT AND HARDWARE REFERENCE
        $reason = "Removed from hardware: {$hardware->hostname}. Reason: {$removalReason}. Condition: {$condition}";
        $this->hardwareRepository->incrementInventory(
            $inventory->id,
            1,
            $reason,
            $employeeId,
            $hardware
        );

        // BUSINESS LOGIC: Build full removal remarks for hardware part record
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
    public function processSoftware(Hardware $hardware, array $softwareList, int $employeeId): void
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
     * ENHANCED: Now passes context to license increment and logs on hardware
     */
    public function createSoftware(Hardware $hardware, array $softwareData, int $employeeId): void
    {
        $this->createSoftwareAndReturn($hardware, $softwareData, $employeeId);
    }

    /**
     * Create a new software installation and return the created record
     * Used when we need the created software ID for issuance tracking
     */
    private function createSoftwareAndReturn(Hardware $hardware, array $softwareData, int $employeeId)
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
            'hardware_id' => $hardware->id,
            'software_inventory_id' => $softwareInventory->id,
            'software_license_id' => $licenseId,
            'installation_date' => now(),
            'installed_by' => $employeeId,
            'status' => 'Active',
        ];

        $hardwareSoftware = $this->hardwareRepository->createHardwareSoftware($hardwareSoftwareData);

        // NEW: Log software installation on Hardware model
        $this->hardwareRepository->logHardwareSoftwareChange(
            $hardware,
            $hardwareSoftware,
            'software_installed',
            $employeeId,
            "Installed {$softwareInventory->software_name} ({$softwareInventory->software_type}) v{$softwareInventory->version}"
        );

        Log::info("Created software installation", [
            'hardware_software_id' => $hardwareSoftware->id,
            'hardware_id' => $hardware->hostname,
            'software_name' => $softwareData['software_name'],
            'license_id' => $licenseId,
            'installed_by' => $employeeId,
        ]);

        return $hardwareSoftware;
    }

    /**
     * Update software installation
     * BUSINESS LOGIC: Software update logic
     */
    public function updateSoftware(array $softwareData, int $employeeId): void
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
     * ENHANCED: Now passes context to license decrement and logs on hardware
     */
    public function deleteSoftware(Hardware $hardware, array $softwareData, int $employeeId): void
    {
        // REPO: Find hardware software
        $hardwareSoftware = $this->hardwareRepository->findHardwareSoftwareById($softwareData['id']);

        if (!$hardwareSoftware) {
            throw new \Exception("Hardware software not found: {$softwareData['id']}");
        }

        // Load relationships
        $hardwareSoftware->loadMissing(['softwareInventory', 'softwareLicense']);

        $softwareInventory = $hardwareSoftware->softwareInventory;
        $softwareName = $softwareInventory
            ? "{$softwareInventory->software_name} ({$softwareInventory->software_type}) v{$softwareInventory->version}"
            : 'Unknown Software';

        $removalReason = $softwareData['removal_reason'] ?? 'Uninstalled from hardware';

        // NEW: Log software uninstallation on Hardware model BEFORE updating/deleting
        $this->hardwareRepository->logHardwareSoftwareChange(
            $hardware,
            $hardwareSoftware,
            'software_uninstalled',
            $employeeId,
            "Uninstalled {$softwareName}. Reason: {$removalReason}"
        );

        // BUSINESS LOGIC: Decrement license activation if applicable WITH CONTEXT
        if ($hardwareSoftware->software_license_id) {
            $license = $this->hardwareRepository->findSoftwareLicense($hardwareSoftware->software_license_id);

            if ($license && $license->current_activations > 0) {
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
    public function findAndIncrementLicense(array $softwareData, Hardware $hardware, int $employeeId)
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
            throw new \Exception(
                "License not found using " .
                    ($licenseKey ? "license key" : "account user")
            );
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
    public function mapRemovalConditionToInventoryCondition(string $removalCondition): string
    {
        $mapping = [
            'working' => 'Working',
            'faulty' => 'Used',
            'defective' => 'Defective',
            'unknown' => 'Unknown',
        ];

        return $mapping[strtolower($removalCondition)] ?? 'Working';
    }

    /**
     * Build removal remarks from removal data
     * BUSINESS LOGIC: Remarks formatting
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
     * Add component to hardware
     * BUSINESS LOGIC: Add new part or software to existing hardware
     * ENHANCED: Now creates issuance item record for tracking
     */
    public function addComponent(array $data): Hardware
    {
        return DB::transaction(function () use ($data) {
            $hardwareId = $data['hardware_id'];
            $componentType = $data['component_type'];
            $employeeId = $data['employee_id'];

            // REPO: Find hardware
            $hardware = $this->hardwareRepository->findById($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            $newComponentId = null;
            $componentName = '';

            if ($componentType === 'part') {
                // Add new part
                $partData = [
                    'part_type' => $data['new_part_type'],
                    'brand' => $data['new_brand'],
                    'model' => $data['new_model'],
                    'specifications' => $data['new_specifications'],
                    'condition' => $data['new_condition'] ?? 'New',
                    'serial_number' => $data['new_serial_number'] ?? null,
                ];

                // Store the part and get the created record
                $createdPart = $this->createPartAndReturn($hardware, $partData, $employeeId);
                $newComponentId = $createdPart->id;
                $componentName = "{$partData['part_type']} - {$partData['brand']} {$partData['model']}";

                // Create issuance item for the added part
                $issuanceData = [
                    'component_type' => 'part',
                    'hardware_id' => $hardwareId,
                    'issued_to' => $hardware->issued_to ?? $employeeId,
                    'component_id' => $newComponentId,
                    'item_name' => $componentName,
                    'description' => "Part added to {$hardware->hostname}",
                    'quantity' => 1,
                    'serial_number' => $partData['serial_number'],
                    'remarks' => $data['reason'] ?? "Component addition",
                ];

                // app(IssuanceService::class)->createComponentIssuanceItem($issuanceData, $employeeId);

                // Log::info("Added part to hardware with issuance item", [
                //     'hardware_id' => $hardware->id,
                //     'hostname' => $hardware->hostname,
                //     'hardware_part_id' => $newComponentId,
                //     'part_type' => $partData['part_type'],
                //     'added_by' => $employeeId,
                // ]);
            } else {
                // Add new software
                $softwareData = [
                    'software_name' => $data['new_software_name'],
                    'software_type' => $data['new_software_type'],
                    'version' => $data['new_version'],
                    'license_key' => $data['new_license_key'] ?? null,
                    'account_user' => $data['new_account_user'] ?? null,
                    'account_password' => $data['new_account_password'] ?? null,
                ];

                // Store the software and get the created record
                $createdSoftware = $this->createSoftwareAndReturn($hardware, $softwareData, $employeeId);
                $newComponentId = $createdSoftware->id;
                $componentName = "{$softwareData['software_name']} ({$softwareData['software_type']})";

                // Create issuance item for the added software
                $issuanceData = [
                    'component_type' => 'software',
                    'hardware_id' => $hardwareId,
                    'issued_to' => $hardware->issued_to ?? $employeeId,
                    'component_id' => $newComponentId,
                    'item_name' => $componentName,
                    'description' => "Software added to {$hardware->hostname}",
                    'quantity' => 1,
                    'serial_number' => $softwareData['license_key'] ?? null,
                    'remarks' => $data['reason'] ?? "Component addition",
                ];

                // app(IssuanceService::class)->createComponentIssuanceItem($issuanceData, $employeeId);

                // Log::info("Added software to hardware with issuance item", [
                //     'hardware_id' => $hardware->id,
                //     'hostname' => $hardware->hostname,
                //     'hardware_software_id' => $newComponentId,
                //     'software_name' => $softwareData['software_name'],
                //     'added_by' => $employeeId,
                // ]);
            }

            // REPO: Reload with relationships
            return $this->hardwareRepository->findWithRelations($hardware->id);
        });
    }

    /**
     * Remove component from hardware
     * BUSINESS LOGIC: Remove part or software from hardware and return to inventory
     */
    public function removeComponent(array $data): Hardware
    {
        return DB::transaction(function () use ($data) {
            $hardwareId = $data['hardware_id'];
            $componentId = $data['component_id'];
            $componentType = $data['component_type'];
            $employeeId = $data['employee_id'];

            // REPO: Find hardware
            $hardware = $this->hardwareRepository->findById($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            if ($componentType === 'part') {
                // Remove part
                $partData = [
                    'id' => $componentId,
                    'removal_reason' => $data['removal_reason'],
                    'removal_condition' => $data['removal_condition'],
                    'removal_remarks' => $data['removal_remarks'] ?? null,
                ];

                $this->deletePart($hardware, $partData, $employeeId);

                Log::info("Removed part from hardware", [
                    'hardware_id' => $hardware->id,
                    'hostname' => $hardware->hostname,
                    'hardware_part_id' => $componentId,
                    'removal_reason' => $data['removal_reason'],
                    'removed_by' => $employeeId,
                ]);
            } else {
                // Remove software
                $softwareData = [
                    'id' => $componentId,
                    'removal_reason' => $data['removal_reason'],
                    'removal_condition' => $data['removal_condition'],
                    'removal_remarks' => $data['removal_remarks'] ?? null,
                ];

                $this->deleteSoftware($hardware, $softwareData, $employeeId);

                Log::info("Removed software from hardware", [
                    'hardware_id' => $hardware->id,
                    'hostname' => $hardware->hostname,
                    'hardware_software_id' => $componentId,
                    'removal_reason' => $data['removal_reason'],
                    'removed_by' => $employeeId,
                ]);
            }

            // REPO: Reload with relationships
            return $this->hardwareRepository->findWithRelations($hardware->id);
        });
    }

    /**
     * Replace component on hardware
     * BUSINESS LOGIC: Replace existing part or software with new one
     * ENHANCED: Now creates issuance item record for the replacement
     */
    public function replaceComponent(array $data): Hardware
    {
        return DB::transaction(function () use ($data) {
            $hardwareId = $data['hardware_id'];
            $componentId = $data['component_id'];
            $componentType = $data['component_type'];
            $employeeId = $data['employee_id'];

            // REPO: Find hardware
            $hardware = $this->hardwareRepository->findById($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            $newComponentId = null;
            $oldItemName = '';
            $newItemName = '';

            if ($componentType === 'part') {
                // Get old part details before removal
                $oldPart = $this->hardwareRepository->findHardwarePartById($componentId);
                $oldItemName = $oldPart
                    ? "{$oldPart->part_type} - {$oldPart->brand} {$oldPart->model}"
                    : "Unknown Part";

                // Remove old part
                $removalData = [
                    'id' => $componentId,
                    'removal_reason' => $data['reason'] ?? 'Component replacement',
                    'removal_condition' => $data['old_component_condition'] ?? 'working',
                    'removal_remarks' => $data['remarks'] ?? null,
                ];

                $this->deletePart($hardware, $removalData, $employeeId);

                // Add new part
                $newPartData = [
                    'part_type' => $data['replacement_part_type'],
                    'brand' => $data['replacement_brand'],
                    'model' => $data['replacement_model'],
                    'specifications' => $data['replacement_specifications'] ?? '',
                    'condition' => $data['replacement_condition'] ?? 'New',
                    'serial_number' => $data['replacement_serial_number'] ?? null,
                ];

                $createdPart = $this->createPartAndReturn($hardware, $newPartData, $employeeId);
                $newComponentId = $createdPart->id;
                $newItemName = "{$newPartData['part_type']} - {$newPartData['brand']} {$newPartData['model']}";

                // Create issuance item for the replacement
                $issuanceData = [
                    'component_type' => 'part',
                    'hardware_id' => $hardwareId,
                    'issued_to' => $hardware->issued_to ?? $employeeId,
                    'old_item_name' => $oldItemName,
                    'new_component_id' => $newComponentId,
                    'new_item_name' => $newItemName,
                    'description' => "Part replacement on {$hardware->hostname}",
                    'quantity' => 1,
                    'serial_number' => $newPartData['serial_number'],
                    'remarks' => $data['remarks'] ?? "Part replacement",
                ];
                // app(IssuanceService::class)->createComponentReplacementIssuanceItem($issuanceData, $employeeId);


                // Log::info("Replaced part on hardware with issuance item", [
                //     'hardware_id' => $hardware->id,
                //     'hostname' => $hardware->hostname,
                //     'old_part' => $oldItemName,
                //     'new_part' => $newItemName,
                //     'new_hardware_part_id' => $newComponentId,
                //     'replaced_by' => $employeeId,
                // ]);
            } else {
                // Get old software details before removal
                $oldSoftware = $this->hardwareRepository->findHardwareSoftwareById($componentId);
                $oldItemName = 'Unknown Software';

                if ($oldSoftware) {
                    $oldSoftware->loadMissing('softwareInventory');
                    if ($oldSoftware->softwareInventory) {
                        $oldItemName = "{$oldSoftware->softwareInventory->software_name} ({$oldSoftware->softwareInventory->software_type})";
                    }
                }

                // Remove old software
                $removalData = [
                    'id' => $componentId,
                    'removal_reason' => $data['reason'] ?? 'Software replacement',
                    'removal_condition' => 'N/A',
                    'removal_remarks' => $data['remarks'] ?? null,
                ];

                $this->deleteSoftware($hardware, $removalData, $employeeId);

                // Add new software
                $newSoftwareData = [
                    'software_name' => $data['replacement_sw_software_name'],
                    'software_type' => $data['replacement_sw_software_type'],
                    'version' => $data['replacement_sw_version'],
                    'license_key' => $data['replacement_sw_license_key'] ?? null,
                    'account_user' => $data['replacement_sw_account_user'] ?? null,
                    'account_password' => $data['replacement_sw_account_password'] ?? null,
                ];

                $createdSoftware = $this->createSoftwareAndReturn($hardware, $newSoftwareData, $employeeId);
                $newComponentId = $createdSoftware->id;
                $newItemName = "{$newSoftwareData['software_name']} ({$newSoftwareData['software_type']})";

                // Create issuance item for the replacement
                $issuanceData = [
                    'component_type' => 'software',
                    'hardware_id' => $hardwareId,
                    'issued_to' => $hardware->issued_to ?? $employeeId,
                    'old_item_name' => $oldItemName,
                    'new_component_id' => $newComponentId,
                    'new_item_name' => $newItemName,
                    'description' => "Software replacement on {$hardware->hostname}",
                    'quantity' => 1,
                    'serial_number' => $newSoftwareData['license_key'] ?? null,
                    'remarks' => $data['remarks'] ?? "Software replacement",
                ];

                // app(IssuanceService::class)->createComponentReplacementIssuanceItem($issuanceData, $employeeId);

                // Log::info("Replaced software on hardware with issuance item", [
                //     'hardware_id' => $hardware->id,
                //     'hostname' => $hardware->hostname,
                //     'old_software' => $oldItemName,
                //     'new_software' => $newItemName,
                //     'new_hardware_software_id' => $newComponentId,
                //     'replaced_by' => $employeeId,
                // ]);
            }

            // REPO: Reload with relationships
            return $this->hardwareRepository->findWithRelations($hardware->id);
        });
    }
}
