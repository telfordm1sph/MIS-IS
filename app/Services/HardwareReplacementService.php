<?php

namespace App\Services;

use App\Repositories\HardwareRepository;
use App\Models\Hardware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\HardwareUpdateService;

class HardwareReplacementService
{
    protected HardwareRepository $hardwareRepository;
    protected HardwareUpdateService $hardwareUpdateService;

    public function __construct(
        HardwareRepository $hardwareRepository,
        HardwareUpdateService $hardwareUpdateService
    ) {
        $this->hardwareRepository = $hardwareRepository;
        $this->hardwareUpdateService = $hardwareUpdateService;
    }

    /**
     * Replace a hardware component
     * BUSINESS LOGIC: Handle replacement by returning old part to inventory and installing new part
     * All logging is handled automatically by existing systems
     */
    public function replaceComponent(array $payload): Hardware
    {
        return DB::transaction(function () use ($payload) {
            $hardwareId = (int) $payload['hardware_id'];
            $employeeId = (int) $payload['employee_id'];
            $componentId = $payload['component_id'];
            $componentType = $payload['component_type'];

            Log::info('Starting component replacement', [
                'hardware_id' => $hardwareId,
                'component_id' => $componentId,
                'employee_id' => $employeeId,
            ]);

            // Step 1: Find the hardware
            $hardware = $this->hardwareRepository->findById($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found: {$hardwareId}");
            }

            // Step 2: Find the existing part to be replaced
            $existingPart = $this->findExistingComponent($hardware, $componentId, $componentType);

            if (!$existingPart) {
                throw new \Exception("Component not found on hardware: {$componentId}");
            }

            // Step 3: Remove old part using existing deletePart
            // Automatically logs via: createInventoryContextLog(), Loggable trait, logHardwarePartChange()
            $removalData = $this->prepareRemovalData($payload, $existingPart);
            $this->hardwareUpdateService->deletePart($hardware, $removalData, $employeeId);

            // Step 4: Install new replacement part using existing createPart
            // Automatically logs via: createInventoryContextLog(), Loggable trait, logHardwarePartChange()
            $newPartData = $this->prepareNewPartData($payload);
            $this->hardwareUpdateService->createPart($hardware, $newPartData, $employeeId);

            Log::info('Component replacement completed successfully', [
                'hardware_id' => $hardware->id,
                'hostname' => $hardware->hostname,
                'employee_id' => $employeeId,
            ]);

            // Step 5: Reload hardware with relationships
            return $this->hardwareRepository->findWithRelations($hardware->id);
        });
    }

    /**
     * Find existing component on hardware
     */
    protected function findExistingComponent(Hardware $hardware, string $componentId, string $componentType)
    {
        if ($componentType === 'part') {
            return $this->hardwareRepository->findHardwarePartById((int) $componentId);
        }

        throw new \Exception("Unsupported component type: {$componentType}");
    }

    /**
     * Prepare removal data for old part
     */
    protected function prepareRemovalData(array $payload, $existingPart): array
    {
        return [
            'id' => $existingPart->id,
            '_delete' => true,
            'removal_reason' => $payload['reason'] ?? 'Replaced',
            'removal_condition' => $this->mapConditionToSystemFormat($payload['old_component_condition'] ?? 'Damaged'),
            'removal_remarks' => $payload['remarks'] ?? 'Replaced with new component',
        ];
    }

    /**
     * Prepare new part data from replacement payload
     */
    protected function prepareNewPartData(array $payload): array
    {
        return [
            'part_type' => $payload['replacement_part_type'],
            'brand' => $payload['replacement_brand'],
            'model' => $payload['replacement_model'],
            'specifications' => $payload['replacement_specifications'] ?? '',
            'serial_number' => $payload['replacement_serial_number'] ?? null,
            'condition' => $payload['replacement_condition'] ?? 'Working',
        ];
    }

    /**
     * Map condition to system format for removal
     */
    protected function mapConditionToSystemFormat(string $condition): string
    {
        $conditionMap = [
            'good' => 'working',
            'bad' => 'defective',
            'damaged' => 'defective',
            'broken' => 'defective',
            'working' => 'working',
            'defective' => 'defective',
            'unknown' => 'unknown',
            'faulty' => 'working',
            'not working' => 'defective',
        ];

        $lowerCondition = strtolower($condition);
        return $conditionMap[$lowerCondition] ?? 'unknown';
    }
}
