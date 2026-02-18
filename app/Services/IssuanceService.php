<?php

namespace App\Services;

use App\Constants\IssuanceStatus;
use App\Repositories\IssuanceRepository;
use App\Repositories\HardwareDetailRepository;
use Illuminate\Support\Facades\Log;

class IssuanceService
{
    protected IssuanceRepository $issuanceRepository;
    protected HardwareDetailRepository $hardwareDetailRepository;
    protected HardwareUpdateService $hardwareUpdateService;

    public function __construct(
        IssuanceRepository $issuanceRepository,
        HardwareDetailRepository $hardwareDetailRepository,
        HardwareUpdateService $hardwareUpdateService
    ) {
        $this->issuanceRepository = $issuanceRepository;
        $this->hardwareDetailRepository = $hardwareDetailRepository;
        $this->hardwareUpdateService = $hardwareUpdateService;
    }

    public function generateIssuanceNumber(): string
    {
        // REPOSITORY: Get the last issuance number
        $lastIssuance = $this->issuanceRepository->getLastIssuanceNumber();
        $lastIssuanceNumber = $lastIssuance ? $lastIssuance->issuance_number : null;

        $year = date('Y');

        $prefix = "ISS-{$year}-";

        if ($lastIssuanceNumber) {
            $parts = explode('-', $lastIssuanceNumber);
            $lastNumber = intval(end($parts));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix . $newNumber;
    }

    /**
     * BUSINESS LOGIC: Process component maintenance operations (ADD, REPLACE, REMOVE)
     */
    public function processComponentMaintenance(array $operations, int $createdBy): array
    {
        try {
            // Validate operations
            $this->validateOperations($operations);

            // Get hardware info from first operation
            $firstOp = $operations[0];
            $hardware = $this->hardwareDetailRepository->getHardwareInfoById($firstOp['hardware_id']);

            if (!$hardware) {
                throw new \Exception("Hardware not found: {$firstOp['hardware_id']}");
            }

            // Extract issued_to from first operation (should be the same for all)
            $issuedTo = $firstOp['issued_to'] ?? $hardware->issued_to ?? $createdBy;

            // Process each operation using HardwareUpdateService (inventory management)
            $processedOperations = [];
            foreach ($operations as $operation) {
                $operation['employee_id'] = $createdBy;
                $operation['issued_to'] = $issuedTo; // Add this line to ensure issued_to is set
                $processedOperation = $this->processSingleOperation($operation, $hardware, $createdBy);
                $processedOperations[] = $processedOperation;
            }

            // Generate issuance number
            $issuanceNumber = $this->generateIssuanceNumber();

            // Prepare issuance data
            $issuanceData = $this->prepareIssuanceData(
                $issuanceNumber,
                $processedOperations,
                $hardware,
                $createdBy,
                $issuedTo
            );

            // Prepare component details for each operation
            $componentDetailsData = [];
            foreach ($processedOperations as $operation) {
                $componentDetailsData[] = $this->prepareComponentDetailData(
                    $operation,
                    $hardware
                );
            }

            // Prepare acknowledgement data
            $acknowledgementData = $this->prepareAcknowledgementData(
                $issuedTo,
                $hardware
            );

            // Delegate to repository for saving
            $result = $this->issuanceRepository->createComponentMaintenanceIssuance(
                $issuanceData,
                $componentDetailsData,
                $acknowledgementData
            );

            Log::info("Component maintenance processed successfully", [
                'issuance_id' => $result['issuance']->id,
                'issuance_number' => $issuanceNumber,
                'operation_count' => count($processedOperations),
                'hardware_id' => $hardware->id,
                'created_by' => $createdBy,
            ]);

            return [
                'success' => true,
                'message' => 'Component maintenance completed successfully',
                'data' => [
                    'issuance_id' => $result['issuance']->id,
                    'issuance_number' => $issuanceNumber,
                    'hardware_id' => $hardware->id,
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'operation_count' => count($processedOperations),
                    'acknowledgement_id' => $result['acknowledgement']->id,
                    'acknowledgement_status' => $result['acknowledgement']->status,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Component maintenance processing failed: ' . $e->getMessage(), [
                'operations' => $operations,
                'created_by' => $createdBy,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process component maintenance: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Create whole unit issuance
     */
    public function createWholeUnitIssuance(array $data, int $createdBy): array
    {
        try {
            $results = [];

            foreach ($data['hostnames'] as $hostnameData) {
                // Get hardware info
                $hardware = $this->hardwareDetailRepository->getHardwareInfo($hostnameData['hostname']);

                if (!$hardware) {
                    throw new \Exception("Hardware not found: {$hostnameData['hostname']}");
                }

                // Generate issuance number
                $issuanceNumber = $this->generateIssuanceNumber();

                // Prepare issuance data
                $issuanceData = [
                    'issuance_number' => $issuanceNumber,
                    'issuance_type' => 1, // Whole Unit
                    'request_number' => $data['request_number'],
                    'issued_to' => $hostnameData['issued_to'],
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'hardware_id' => $hardware->id,
                    'location' => $hostnameData['location'] ?? $hardware->location,
                    'remarks' => $hostnameData['remarks'] ?? null,
                    'created_by' => $createdBy,
                ];

                // Prepare acknowledgement data
                $acknowledgementData = [
                    'reference_type' => 1,
                    'acknowledged_by' => $hostnameData['issued_to'],
                    'status' => 0,
                    'remarks' => null,
                ];

                // Delegate to repository
                $result = $this->issuanceRepository->createWholeUnitIssuance(
                    $issuanceData,
                    $acknowledgementData
                );

                // Update hardware location and issued_to using HardwareUpdateService
                $this->hardwareUpdateService->updateHardware($hardware->id, [
                    'issued_to' => $hostnameData['issued_to'],
                    'location' => $hostnameData['location'] ?? $hardware->location,
                    'date_issued' => now(),
                    'updated_by' => $createdBy,
                ], $createdBy);

                Log::info("Hardware updated during issuance", [
                    'hardware_id' => $hardware->id,
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'issued_to' => $hostnameData['issued_to'],
                    'location' => $hostnameData['location'],
                    'updated_by' => $createdBy,
                ]);

                $results[] = [
                    'issuance_id' => $result['issuance']->id,
                    'issuance_number' => $issuanceNumber,
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'hardware_id' => $hardware->id,
                ];
            }

            return [
                'success' => true,
                'message' => 'Items issued successfully',
                'data' => $results,
            ];
        } catch (\Exception $e) {
            Log::error('Issuance creation failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to create issuance: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Validate operations
     */
    protected function validateOperations(array $operations): void
    {
        if (empty($operations)) {
            throw new \Exception('No operations provided');
        }

        $hardwareId = $operations[0]['hardware_id'] ?? null;
        if (!$hardwareId) {
            throw new \Exception('Hardware ID is required');
        }

        foreach ($operations as $index => $operation) {
            if (!isset($operation['operation'])) {
                throw new \Exception("Operation type missing at index {$index}");
            }

            if (!in_array($operation['operation'], ['add', 'replace', 'remove'])) {
                throw new \Exception("Invalid operation type '{$operation['operation']}' at index {$index}");
            }

            if (!isset($operation['component_type'])) {
                throw new \Exception("Component type missing at index {$index}");
            }

            if (!in_array($operation['component_type'], ['part', 'software'])) {
                throw new \Exception("Invalid component type '{$operation['component_type']}' at index {$index}");
            }

            if ($operation['hardware_id'] != $hardwareId) {
                throw new \Exception("All operations must be for the same hardware");
            }
        }
    }

    /**
     * BUSINESS LOGIC: Process single operation using HardwareUpdateService
     */
    protected function processSingleOperation(array $operation, $hardware, int $employeeId): array
    {
        $result = [
            'operation' => $operation['operation'],
            'component_type' => $operation['component_type'],
            'hardware_id' => $hardware->id,
            'hostname' => $hardware->hostname ?? $hardware->serial,
            'issued_to' => $operation['employee_id'] ?? $hardware->issued_to ?? $employeeId,
            'reason' => $operation['reason'] ?? null,
            'remarks' => $operation['remarks'] ?? null,
        ];

        switch ($operation['operation']) {
            case 'add':
                return $this->processAddOperation($operation, $hardware, $employeeId, $result);

            case 'replace':
                return $this->processReplaceOperation($operation, $hardware, $employeeId, $result);

            case 'remove':
                return $this->processRemoveOperation($operation, $hardware, $employeeId, $result);

            default:
                throw new \Exception("Unknown operation: {$operation['operation']}");
        }
    }

    /**
     * BUSINESS LOGIC: Process ADD operation using HardwareUpdateService
     */
    protected function processAddOperation(array $operation, $hardware, int $employeeId, array $result): array
    {
        // Delegate to HardwareUpdateService for inventory management and component creation
        $componentData = $this->hardwareUpdateService->addComponent([
            'hardware_id' => $hardware->id,
            'component_type' => $operation['component_type'],
            'employee_id' => $employeeId,
            'new_part_type' => $operation['new_part_type'] ?? null,
            'new_brand' => $operation['new_brand'] ?? null,
            'new_model' => $operation['new_model'] ?? null,
            'new_specifications' => $operation['new_specifications'] ?? null,
            'new_condition' => $operation['new_condition'] ?? 'New',
            'new_serial_number' => $operation['new_serial_number'] ?? null,
            'new_software_name' => $operation['new_software_name'] ?? null,
            'new_software_type' => $operation['new_software_type'] ?? null,
            'new_version' => $operation['new_version'] ?? null,
            'new_license_key' => $operation['new_license_key'] ?? null,
            'new_account_user' => $operation['new_account_user'] ?? null,
            'new_account_password' => $operation['new_account_password'] ?? null,
            'reason' => $operation['reason'] ?? null,
        ]);

        return array_merge($result, [
            'new_component_id' => $componentData->id,
            'new_component_data' => $this->extractComponentData($operation, $componentData),
            'new_condition' => $operation['new_condition'] ?? 'New',
            'new_serial_number' => $operation['new_serial_number'] ?? null,
        ]);
    }

    /**
     * BUSINESS LOGIC: Process REPLACE operation using HardwareUpdateService
     */
    protected function processReplaceOperation(array $operation, $hardware, int $employeeId, array $result): array
    {
        // Get old component data before replacement
        $oldComponentData = $this->getOldComponentData(
            $operation['component_id'],
            $operation['component_type']
        );

        // Delegate to HardwareUpdateService for inventory management and component replacement
        $componentData = $this->hardwareUpdateService->replaceComponent([
            'hardware_id' => $hardware->id,
            'component_id' => $operation['component_id'],
            'component_type' => $operation['component_type'],
            'employee_id' => $employeeId,
            'old_component_condition' => $operation['old_component_condition'] ?? 'working',
            'reason' => $operation['reason'] ?? 'Component replacement',
            'remarks' => $operation['remarks'] ?? null,
            'replacement_part_type' => $operation['replacement_part_type'] ?? null,
            'replacement_brand' => $operation['replacement_brand'] ?? null,
            'replacement_model' => $operation['replacement_model'] ?? null,
            'replacement_specifications' => $operation['replacement_specifications'] ?? null,
            'replacement_condition' => $operation['replacement_condition'] ?? 'New',
            'replacement_serial_number' => $operation['replacement_serial_number'] ?? null,
            'replacement_software_name' => $operation['replacement_software_name'] ?? $operation['replacement_sw_software_name'] ?? null,
            'replacement_software_type' => $operation['replacement_software_type'] ?? $operation['replacement_sw_software_type'] ?? null,
            'replacement_version' => $operation['replacement_version'] ?? $operation['replacement_sw_version'] ?? null,
            'replacement_license_key' => $operation['replacement_license_key'] ?? $operation['replacement_sw_license_key'] ?? null,
            'replacement_account_user' => $operation['replacement_account_user'] ?? $operation['replacement_sw_account_user'] ?? null,
            'replacement_account_password' => $operation['replacement_account_password'] ?? $operation['replacement_sw_account_password'] ?? null,
        ]);

        return array_merge($result, [
            'old_component_id' => $operation['component_id'],
            'old_component_condition' => $operation['old_component_condition'] ?? 'working',
            'old_component_data' => $oldComponentData,
            'new_component_id' => $componentData->id,
            'new_component_data' => $this->extractComponentData($operation, $componentData),
            'new_condition' => $operation['replacement_condition'] ?? 'New',
            'new_serial_number' => $operation['replacement_serial_number'] ?? null,
        ]);
    }

    /**
     * BUSINESS LOGIC: Process REMOVE operation using HardwareUpdateService
     */
    protected function processRemoveOperation(array $operation, $hardware, int $employeeId, array $result): array
    {
        // Get old component data before removal
        $oldComponentData = $this->getOldComponentData(
            $operation['component_id'],
            $operation['component_type']
        );

        // Delegate to HardwareUpdateService for inventory management and component removal
        $this->hardwareUpdateService->removeComponent([
            'hardware_id' => $hardware->id,
            'component_id' => $operation['component_id'],
            'component_type' => $operation['component_type'],
            'employee_id' => $employeeId,
            'removal_reason' => $operation['reason'] ?? 'Component removal',
            'removal_condition' => $operation['condition'] ?? 'working',
            'removal_remarks' => $operation['remarks'] ?? null,
        ]);

        return array_merge($result, [
            'old_component_id' => $operation['component_id'],
            'old_component_condition' => $operation['condition'] ?? 'working',
            'old_component_data' => $oldComponentData,
        ]);
    }

    /**
     * BUSINESS LOGIC: Get old component data for tracking
     */
    protected function getOldComponentData(int $componentId, string $componentType): ?array
    {
        if ($componentType === 'part') {
            $component = $this->hardwareDetailRepository->getHardwarePartById($componentId);
            if ($component) {
                return [
                    'id' => $component->id,
                    'part_type' => $component->part_type,
                    'brand' => $component->brand,
                    'model' => $component->model,
                    'specifications' => $component->specifications,
                    'serial_number' => $component->serial_number,
                    'condition' => $component->condition,
                    'installed_date' => $component->installed_date,
                ];
            }
        } else {
            $component = $this->hardwareDetailRepository->getHardwareSoftwareById($componentId);
            if ($component) {
                $component->loadMissing(['softwareInventory', 'softwareLicense']);
                return [
                    'id' => $component->id,
                    'software_name' => $component->softwareInventory->software_name ?? null,
                    'software_type' => $component->softwareInventory->software_type ?? null,
                    'version' => $component->softwareInventory->version ?? null,
                    'license_key' => $component->softwareLicense->license_key ?? null,
                    'account_user' => $component->softwareLicense->account_user ?? null,
                    'installation_date' => $component->installation_date,
                ];
            }
        }

        return null;
    }

    /**
     * BUSINESS LOGIC: Extract component data for tracking
     */
    protected function extractComponentData(array $operation, $component): array
    {
        if ($operation['component_type'] === 'part') {
            return [
                'part_type' => $operation['new_part_type'] ?? $operation['replacement_part_type'] ?? $component->part_type,
                'brand' => $operation['new_brand'] ?? $operation['replacement_brand'] ?? $component->brand,
                'model' => $operation['new_model'] ?? $operation['replacement_model'] ?? $component->model,
                'specifications' => $operation['new_specifications'] ?? $operation['replacement_specifications'] ?? $component->specifications,
                'serial_number' => $operation['new_serial_number'] ?? $operation['replacement_serial_number'] ?? $component->serial_number,
                'condition' => $operation['new_condition'] ?? $operation['replacement_condition'] ?? $component->condition,
            ];
        } else {
            return [
                'software_name' => $operation['new_software_name'] ?? $operation['replacement_software_name'] ?? $operation['replacement_sw_software_name'] ?? $component->softwareInventory->software_name ?? null,
                'software_type' => $operation['new_software_type'] ?? $operation['replacement_software_type'] ?? $operation['replacement_sw_software_type'] ?? $component->softwareInventory->software_type ?? null,
                'version' => $operation['new_version'] ?? $operation['replacement_version'] ?? $operation['replacement_sw_version'] ?? $component->softwareInventory->version ?? null,
                'license_key' => $operation['new_license_key'] ?? $operation['replacement_license_key'] ?? $operation['replacement_sw_license_key'] ?? $component->softwareLicense->license_key ?? null,
                'account_user' => $operation['new_account_user'] ?? $operation['replacement_account_user'] ?? $operation['replacement_sw_account_user'] ?? $component->softwareLicense->account_user ?? null,
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Prepare issuance data
     */
    protected function prepareIssuanceData(string $issuanceNumber, array $operations, $hardware, int $createdBy, string $issuedTo): array
    {
        return [
            'issuance_number' => $issuanceNumber,
            'issuance_type' => 2, // Component Maintenance
            'issued_to' => $issuedTo, // Use the passed issued_to
            'hostname' => $hardware->hostname ?? $hardware->serial,
            'hardware_id' => $hardware->id,
            'location' => $hardware->location,
            'remarks' => 'Component maintenance operation',
            'created_by' => $createdBy,
        ];
    }

    /**
     * BUSINESS LOGIC: Prepare component detail data
     */
    protected function prepareComponentDetailData(array $operation, $hardware): array
    {
        $detailData = [
            'operation_type' => $operation['operation'],
            'component_type' => $operation['component_type'],
            'reason' => $operation['reason'] ?? null,
            'remarks' => $operation['remarks'] ?? null,
        ];

        // Add old component data (for replace and remove)
        if (isset($operation['old_component_id'])) {
            $detailData['old_component_id'] = $operation['old_component_id'];
            $detailData['old_component_condition'] = $operation['old_component_condition'] ?? null;
            $detailData['old_component_data'] = $operation['old_component_data'] ?? null;
        }

        // Add new component data (for add and replace)
        if (isset($operation['new_component_id'])) {
            $detailData['new_component_id'] = $operation['new_component_id'];
            $detailData['new_component_condition'] = $operation['new_condition'] ?? null;
            $detailData['new_component_data'] = $operation['new_component_data'] ?? null;
        }

        // Add hardware changes context
        $detailData['hardware_changes'] = [
            'hardware_id' => $hardware->id,
            'hostname' => $hardware->hostname ?? $hardware->serial,
            'operation' => $operation['operation'],
            'component_type' => $operation['component_type'],
            'performed_at' => now()->toDateTimeString(),
        ];

        return $detailData;
    }

    /**
     * BUSINESS LOGIC: Prepare acknowledgement data
     */
    protected function prepareAcknowledgementData(string $acknowledgedBy, $hardware): array
    {
        return [
            'reference_type' => 1, // Issuance
            'acknowledged_by' => $acknowledgedBy,
            'status' => 0, // Pending
            'remarks' => "Component maintenance on {$hardware->hostname}",
        ];
    }

    /**
     * BUSINESS LOGIC: Acknowledge an issuance
     */
    public function acknowledgeIssuance($issuanceId, $employeeId)
    {
        try {
            // Get the issuance with acknowledgement
            $issuance = $this->issuanceRepository->findIssuanceWithAcknowledgement($issuanceId);

            if (!$issuance) {
                return [
                    'success' => false,
                    'message' => 'Issuance not found',
                    'status' => 404,
                ];
            }

            $acknowledgement = $issuance->acknowledgement;

            if (!$acknowledgement) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement record not found',
                    'status' => 404,
                ];
            }

            // Business logic validation
            if ($acknowledgement->status == IssuanceStatus::ACKNOWLEDGED) {
                return [
                    'success' => false,
                    'message' => 'This issuance has already been acknowledged',
                    'status' => 403,
                ];
            }

            if ($acknowledgement->acknowledged_by != $employeeId) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to acknowledge this item',
                    'status' => 403,
                ];
            }

            // Prepare update data
            $updateData = [
                'status' => IssuanceStatus::ACKNOWLEDGED,
                'acknowledged_at' => now(),
                'remarks' => 'Acknowledged via system',
            ];

            // Delegate to repository
            $updated = $this->issuanceRepository->updateAcknowledgement($acknowledgement->id, $updateData);

            Log::info("Issuance acknowledged", [
                'issuance_id' => $issuanceId,
                'acknowledgement_id' => $acknowledgement->id,
                'employee_id' => $employeeId,
                'acknowledged_at' => now(),
            ]);

            return [
                'success' => true,
                'message' => 'Issuance acknowledged successfully',
                'data' => [
                    'id' => $acknowledgement->id,
                    'status_label' => IssuanceStatus::getLabel(IssuanceStatus::ACKNOWLEDGED),
                    'status_color' => IssuanceStatus::getColor(IssuanceStatus::ACKNOWLEDGED),
                    'acknowledged_at' => now(),
                ],
                'status' => 200,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to acknowledge issuance: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to acknowledge issuance: ' . $e->getMessage(),
                'status' => 500,
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Update acknowledgement status
     */
    public function updateAcknowledgementStatus($id, int $employeeId)
    {
        try {
            $acknowledgement = $this->issuanceRepository->findAcknowledgement($id);

            if (!$acknowledgement) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement not found',
                    'status' => 404,
                ];
            }

            // Business logic validation
            if ($acknowledgement->status !== 0) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement has already been processed',
                    'status' => 403,
                ];
            }

            if ($acknowledgement->acknowledged_by != $employeeId) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to acknowledge this item',
                    'status' => 403,
                ];
            }

            // Prepare update data
            $updateData = [
                'status' => 1, // Acknowledged
                'acknowledged_at' => now(),
            ];

            // Delegate to repository
            $updated = $this->issuanceRepository->updateAcknowledgement($id, $updateData);

            Log::info("Acknowledgement status updated to 1", [
                'acknowledgement_id' => $id,
                'employee_id' => $employeeId,
            ]);

            return [
                'success' => true,
                'message' => 'Acknowledgement updated successfully',
                'data' => $updated,
                'status' => 200,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to update acknowledgement: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to update acknowledgement: ' . $e->getMessage(),
                'status' => 500,
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Get whole unit issuance table data
     */
    public function getWholeUnitIssuanceTable(array $filters)
    {
        try {
            $result = $this->issuanceRepository->getWholeUnitIssuancesTable($filters);

            // Format data for frontend
            $formattedData = $result['data']->map(function ($issuance) {
                return [
                    'id' => $issuance->id,
                    'issuance_number' => $issuance->issuance_number,
                    'request_number' => $issuance->request_number,
                    'hostname' => $issuance->hostname,
                    'location' => $issuance->location,
                    'issued_to' => $issuance->issued_to,
                    'recipient_name' => $issuance->recipient
                        ? trim("{$issuance->recipient->EMPNAME}")
                        : 'N/A',
                    'acknowledgement' => $issuance->acknowledgement ? [
                        'id' => $issuance->acknowledgement->id,
                        'acknowledged_by' => $issuance->acknowledgement->acknowledged_by,
                        'status' => $issuance->acknowledgement->status,
                        'status_label' => IssuanceStatus::getLabel($issuance->acknowledgement->status),
                        'status_color' => IssuanceStatus::getColor($issuance->acknowledgement->status),
                        'acknowledged_at' => $issuance->acknowledgement->acknowledged_at,
                        'remarks' => $issuance->acknowledgement->remarks,
                    ] : null,
                    'remarks' => $issuance->remarks,
                    'created_at' => $issuance->created_at,
                    'created_by' => $issuance->created_by,
                    'creator_name' => $issuance->creator
                        ? trim("{$issuance->creator->EMPNAME}")
                        : 'N/A',
                ];
            });

            return [
                'success' => true,
                'data' => $formattedData,
                'pagination' => $result['pagination'],
                'filters' => $filters,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get whole unit issuance table: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to retrieve data: ' . $e->getMessage(),
                'data' => [],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 0,
                    'total_records' => 0,
                    'page_size' => $filters['pageSize'] ?? 10,
                ],
                'filters' => $filters,
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Get component maintenance issuances table
     */
    public function getComponentMaintenanceIssuanceTable(array $filters)
    {
        try {
            $result = $this->issuanceRepository->getComponentMaintenanceIssuancesTable($filters);

            // Format data for frontend
            $formattedData = $result['data']->map(function ($issuance) {
                return [
                    'id' => $issuance->id,
                    'issuance_number' => $issuance->issuance_number,
                    'issuance_type' => 2,
                    'hostname' => $issuance->hostname,
                    'hardware_id' => $issuance->hardware_id,
                    'location' => $issuance->location,
                    'issued_to' => $issuance->issued_to,
                    'recipient_name' => $issuance->recipient
                        ? trim("{$issuance->recipient->EMPNAME}")
                        : 'N/A',
                    'component_count' => $issuance->componentDetails->count(),
                    'operations' => $issuance->componentDetails->map(function ($detail) {
                        return [
                            'operation_type' => $detail->operation_type,
                            'component_type' => $detail->component_type,
                            'old_component_id' => $detail->old_component_id,
                            'new_component_id' => $detail->new_component_id,
                            'reason' => $detail->reason,
                        ];
                    }),
                    'acknowledgement' => $issuance->acknowledgement ? [
                        'id' => $issuance->acknowledgement->id,
                        'acknowledged_by' => $issuance->acknowledgement->acknowledged_by,
                        'status' => $issuance->acknowledgement->status,
                        'status_label' => IssuanceStatus::getLabel($issuance->acknowledgement->status),
                        'status_color' => IssuanceStatus::getColor($issuance->acknowledgement->status),
                        'acknowledged_at' => $issuance->acknowledgement->acknowledged_at,
                        'remarks' => $issuance->acknowledgement->remarks,
                    ] : null,
                    'created_at' => $issuance->created_at,
                    'created_by' => $issuance->created_by,
                    'creator_name' => $issuance->creator
                        ? trim("{$issuance->creator->EMPNAME}")
                        : 'N/A',
                ];
            });

            return [
                'success' => true,
                'data' => $formattedData,
                'pagination' => $result['pagination'],
                'filters' => $filters,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get component maintenance issuance table: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to retrieve data: ' . $e->getMessage(),
                'data' => [],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 0,
                    'total_records' => 0,
                    'page_size' => $filters['pageSize'] ?? 10,
                ],
                'filters' => $filters,
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Get acknowledgement details
     */
    public function getAcknowledgementDetails($id)
    {
        try {
            $acknowledgement = $this->issuanceRepository->findAcknowledgement($id);

            if (!$acknowledgement) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement not found',
                ];
            }

            // Load relationships based on reference type
            if ($acknowledgement->reference_type == 1) {
                $acknowledgement->load(['issuance.hardware', 'issuance.componentDetails']);
            }

            return [
                'success' => true,
                'data' => $acknowledgement,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get acknowledgement details: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to retrieve details: ' . $e->getMessage(),
            ];
        }
    }
}
