<?php

namespace App\Services\Traits;

use App\Repositories\HardwareRepository;
use Illuminate\Support\Facades\Log;

trait PartOperationsTrait
{

    /**
     * Process parts (create, update, delete) for any entity
     * BUSINESS LOGIC: Orchestrate part operations
     */
    public function processParts($entity, array $parts, int $employeeId): void
    {
        foreach ($parts as $partData) {
            if (isset($partData['_delete']) && $partData['_delete'] === true) {
                $this->deletePart($entity, $partData, $employeeId);
            } elseif (isset($partData['id'])) {
                $this->updatePart($partData, $employeeId);
            } elseif (!empty($partData['bypass_inventory'])) {
                $this->createPartManual($entity, $partData, $employeeId);
            } else {
                $this->createPart($entity, $partData, $employeeId);
            }
        }
    }

    /**
     * Create a new part and update inventory
     */
    public function createPart($entity, array $partData, int $employeeId): void
    {
        $this->createPartAndReturn($entity, $partData, $employeeId);
    }

    /**
     * Create a new part and return the created record
     */
    private function createPartAndReturn($entity, array $partData, int $employeeId)
    {
        $specifications = $partData['specifications'] ?? '';
        $condition = $partData['condition'] ?? 'Working';

        // Find the Part record
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

        // Find available inventory WITH SPECIFIC CONDITION
        $inventory = $this->hardwareRepository->findAvailablePartInventory($part->id, $condition);

        if (!$inventory) {
            // Try to find any available inventory as fallback
            $inventory = $this->hardwareRepository->findAvailablePartInventory($part->id, null);

            if (!$inventory) {
                $entityType = $this->getEntityType($entity);
                $entityName = $this->getEntityName($entity);
                throw new \Exception(
                    "No available inventory for {$part->part_type} - {$part->brand} {$part->model}. " .
                        "Requested condition: {$condition} on {$entityType}: {$entityName}"
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

        // Create part record
        $partRecord = $this->createPartRecord($entity, $partData, $condition, $inventory->id, $employeeId);

        // Log part addition
        $this->logPartAddition($entity, $partRecord, $part, $condition, $employeeId);

        // Decrement inventory
        $entityType = $this->getEntityType($entity);
        $entityName = $this->getEntityName($entity);
        $reason = "Installed on {$entityType}: {$entityName}";
        $this->hardwareRepository->decrementInventory(
            $inventory->id,
            1,
            $reason,
            $employeeId,
            $entity
        );

        Log::info("Created {$entityType} part", [
            'part_record_id' => $partRecord->id,
            'entity_id' => $this->getEntityId($entity),
            'entity_name' => $entityName,
            'part_type' => $partData['part_type'],
            'condition' => $condition,
            'inventory_id' => $inventory->id,
            'created_by' => $employeeId,
        ]);

        return $partRecord;
    }

    /**
     * Update an existing part
     */
    public function updatePart(array $partData, int $employeeId): void
    {
        $partRecord = $this->findPartRecordById($partData['id']);

        if (!$partRecord) {
            $entityType = $this->getEntityTypeFromPartData($partData);
            throw new \Exception("{$entityType} part not found: {$partData['id']}");
        }

        $updateData = [
            'serial_number' => $partData['serial_number'] ?? $partRecord->serial_number,
            'remarks' => $partData['remarks'] ?? $partRecord->remarks,
            'updated_by' => $employeeId,
        ];

        $this->updatePartRecord($partRecord->id, $updateData);

        Log::info("Updated {$this->getEntityTypeFromPartRecord($partRecord)} part", [
            'part_record_id' => $partRecord->id,
            'updated_by' => $employeeId,
        ]);
    }

    /**
     * Delete a part and return it to inventory
     */
    public function deletePart($entity, array $partData, int $employeeId): void
    {
        $partRecord = $this->findPartRecordById($partData['id']);

        if (!$partRecord) {
            $entityType = $this->getEntityType($entity);
            throw new \Exception("{$entityType} part not found: {$partData['id']}");
        }

        $part = $this->hardwareRepository->findPart(
            $partRecord->part_type,
            $partRecord->brand,
            $partRecord->model,
            $partRecord->specifications
        );

        if (!$part) {
            $entityType = $this->getEntityType($entity);
            throw new \Exception("Part record not found for {$entityType} part: {$partData['id']}");
        }

        $removalReason = $partData['removal_reason'] ?? 'Removed from ' . strtolower($this->getEntityType($entity));
        $removalCondition = $this->mapRemovalConditionToInventoryCondition(
            $partData['removal_condition'] ?? 'Working'
        );

        // Log part removal
        $this->logPartRemoval($entity, $partRecord, $part, $removalCondition, $removalReason, $employeeId);

        // Update part status
        $this->updatePartRecord($partRecord->id, [
            'status' => $this->getRemovedStatus(),
            'removed_date' => now(),
            'remarks' => $this->buildRemovalRemarks($partData),
            'updated_by' => $employeeId,
        ]);

        // Return to inventory if it was from inventory
        if ($partRecord->source_inventory_id) {
            $entityType = $this->getEntityType($entity);
            $entityName = $this->getEntityName($entity);
            $reason = "Returned from {$entityType}: {$entityName}";
            $this->hardwareRepository->incrementInventory(
                $partRecord->source_inventory_id,
                1,
                $reason,
                $employeeId,
                $entity
            );
        }

        $entityType = $this->getEntityType($entity);
        $entityName = $this->getEntityName($entity);
        Log::info("Deleted {$entityType} part", [
            'part_record_id' => $partRecord->id,
            'entity_id' => $this->getEntityId($entity),
            'entity_name' => $entityName,
            'returned_to_inventory' => $partRecord->source_inventory_id ? true : false,
            'removal_condition' => $removalCondition,
            'deleted_by' => $employeeId,
        ]);
    }

    /**
     * Create a part manually (bypass inventory)
     */
    public function createPartManual($entity, array $partData, int $employeeId): void
    {
        $partRecord = $this->createPartRecordManual($entity, $partData, $employeeId);

        $partType = $partData['part_type'];
        $brand = $partData['brand'];
        $model = $partData['model'];

        $this->logPartAdditionManual($entity, $partRecord, $partType, $brand, $model, $employeeId);

        $entityType = $this->getEntityType($entity);
        $entityName = $this->getEntityName($entity);
        Log::info("Created {$entityType} part manually", [
            'part_record_id' => $partRecord->id,
            'entity_id' => $this->getEntityId($entity),
            'entity_name' => $entityName,
            'part_type' => $partType,
            'created_by' => $employeeId,
        ]);
    }

    // Abstract methods that must be implemented by using classes
    abstract protected function getEntityType($entity): string;
    abstract protected function getEntityName($entity): string;
    abstract protected function getEntityId($entity): int;
    abstract protected function createPartRecord($entity, array $partData, string $condition, int $inventoryId, int $employeeId);
    abstract protected function createPartRecordManual($entity, array $partData, int $employeeId);
    abstract protected function findPartRecordById(int $id);
    abstract protected function updatePartRecord(int $id, array $data): void;
    abstract protected function logPartAddition($entity, $partRecord, $part, string $condition, int $employeeId): void;
    abstract protected function logPartRemoval($entity, $partRecord, $part, string $condition, string $removalReason, int $employeeId): void;
    abstract protected function logPartAdditionManual($entity, $partRecord, string $partType, string $brand, string $model, int $employeeId): void;
    abstract protected function getRemovedStatus(): string;
    abstract protected function getEntityTypeFromPartRecord($partRecord): string;
    abstract protected function getEntityTypeFromPartData(array $partData): string;

    /**
     * Map removal condition to inventory condition
     */
    protected function mapRemovalConditionToInventoryCondition(string $removalCondition): string
    {
        $conditionMap = [
            'Working' => 'Working',
            'Defective' => 'Defective',
            'Damaged' => 'Damaged',
            'Used' => 'Used',
            'working' => 'Working',
            'defective' => 'Defective',
            'damaged' => 'Damaged',
            'used' => 'Used',
        ];

        return $conditionMap[$removalCondition] ?? 'Working';
    }

    /**
     * Build removal remarks
     */
    protected function buildRemovalRemarks(array $removalData): string
    {
        $remarks = [];

        if (!empty($removalData['removal_reason'])) {
            $remarks[] = "Reason: {$removalData['removal_reason']}";
        }

        if (!empty($removalData['removal_condition'])) {
            $remarks[] = "Condition: {$removalData['removal_condition']}";
        }

        if (!empty($removalData['removal_remarks'])) {
            $remarks[] = "Remarks: {$removalData['removal_remarks']}";
        }

        return implode('; ', $remarks);
    }
}
