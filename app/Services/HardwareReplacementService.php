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
     * BUSINESS LOGIC: Handle replacement by delegating to HardwareUpdateService
     * This ensures issuance tracking happens automatically
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

            // Find the hardware
            $hardware = $this->hardwareRepository->findById($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found: {$hardwareId}");
            }

            // Transform payload to match HardwareUpdateService::replaceComponent format
            $transformedPayload = $this->transformPayloadForUpdateService($payload, $hardware, $componentType);

            // Delegate to HardwareUpdateService which handles issuance tracking
            $result = $this->hardwareUpdateService->replaceComponent($transformedPayload);

            Log::info('Component replacement completed successfully', [
                'hardware_id' => $hardware->id,
                'hostname' => $hardware->hostname,
                'employee_id' => $employeeId,
            ]);

            return $result;
        });
    }

    /**
     * Transform the replacement payload to match HardwareUpdateService format
     */
    protected function transformPayloadForUpdateService(array $payload, Hardware $hardware, string $componentType): array
    {
        $transformed = [
            'hardware_id' => $payload['hardware_id'],
            'employee_id' => $payload['employee_id'],
            'component_id' => $payload['component_id'],
            'component_type' => $componentType,
            'old_component_condition' => $this->mapConditionToSystemFormat($payload['old_component_condition'] ?? 'working'),
            'reason' => $payload['reason'] ?? 'Component replacement',
            'remarks' => $payload['remarks'] ?? null,
        ];

        if ($componentType === 'part') {
            $transformed['replacement_part_type'] = $payload['replacement_part_type'];
            $transformed['replacement_brand'] = $payload['replacement_brand'];
            $transformed['replacement_model'] = $payload['replacement_model'];
            $transformed['replacement_specifications'] = $payload['replacement_specifications'] ?? '';
            $transformed['replacement_condition'] = $payload['replacement_condition'] ?? 'New';
            $transformed['replacement_serial_number'] = $payload['replacement_serial_number'] ?? null;
        } else {
            // Software replacement
            $transformed['replacement_sw_software_name'] = $payload['replacement_software_name'];
            $transformed['replacement_sw_software_type'] = $payload['replacement_software_type'];
            $transformed['replacement_sw_version'] = $payload['replacement_version'];
            $transformed['replacement_sw_license_key'] = $payload['replacement_license_key'] ?? null;
            $transformed['replacement_sw_account_user'] = $payload['replacement_account_user'] ?? null;
            $transformed['replacement_sw_account_password'] = $payload['replacement_account_password'] ?? null;
        }

        return $transformed;
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
