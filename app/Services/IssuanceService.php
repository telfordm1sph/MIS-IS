<?php

namespace App\Services;

use App\Constants\IssuanceStatus;
use App\Repositories\IssuanceRepository;
use App\Repositories\HardwareDetailRepository;
use App\Repositories\ReferenceRepository;
use Illuminate\Support\Facades\Log;

class IssuanceService
{
    protected IssuanceRepository $issuanceRepository;
    protected HardwareDetailRepository $hardwareDetailRepository;
    protected HardwareUpdateService $hardwareUpdateService;
    protected ReferenceRepository $referenceRepository;
    public function __construct(
        IssuanceRepository $issuanceRepository,
        HardwareDetailRepository $hardwareDetailRepository,
        HardwareUpdateService $hardwareUpdateService,
        ReferenceRepository $referenceRepository
    ) {
        $this->issuanceRepository = $issuanceRepository;
        $this->hardwareDetailRepository = $hardwareDetailRepository;
        $this->hardwareUpdateService = $hardwareUpdateService;
        $this->referenceRepository = $referenceRepository;
    }

    /**
     * Generate issuance number
     */
    public function generateIssuanceNumber(): string
    {
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
     * BUSINESS LOGIC: Get unified issuance table (type 1 + type 2)
     */
    /**
     * BUSINESS LOGIC: Get unified issuance table (type 1 + type 2)
     */
    public function getIssuanceTable(array $filters): array
    {
        try {
            $result = $this->issuanceRepository->getIssuancesTable($filters);

            $issuances = $result['data'];

            // ✅ 1. Collect unique location IDs
            $locationIds = $issuances
                ->pluck('location')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            // ✅ 2. Get all locations in ONE query
            $locations = $this->referenceRepository
                ->getLocationsByIds($locationIds);

            // ✅ 3. Format data
            $formattedData = $issuances->map(function ($issuance) use ($locations) {

                $locationName = 'N/A';

                if ($issuance->location && isset($locations[$issuance->location])) {
                    $locationName = $locations[$issuance->location]->location_name;
                }

                $isInventoryChange = $issuance->issuance_type === 2;

                $formatted = [
                    'id'              => $issuance->id,
                    'issuance_number' => $issuance->issuance_number,
                    'issuance_type'   => $issuance->issuance_type,
                    'request_number'  => $issuance->request_number,
                    'hostname'        => $issuance->hostname,
                    'hardware_id'     => $issuance->hardware_id,

                    // ✅ Return both ID and Name
                    'location_id'     => $issuance->location,
                    'location_name'   => $locationName,

                    'remarks'         => $issuance->remarks,
                    'created_at'      => $issuance->created_at,
                    'created_by'      => $issuance->created_by,
                    'creator_name'    => $issuance->creator
                        ? trim($issuance->creator->EMPNAME)
                        : 'N/A',

                    'acknowledgement' => $issuance->acknowledgement ? [
                        'id'                   => $issuance->acknowledgement->id,
                        'acknowledged_by'      => $issuance->acknowledgement->acknowledged_by,
                        'acknowledged_by_name' => $issuance->acknowledgement->acknowledgedByEmployee
                            ? trim($issuance->acknowledgement->acknowledgedByEmployee->EMPNAME)
                            : 'N/A',
                        'status'               => $issuance->acknowledgement->status,
                        'status_label'         => IssuanceStatus::getLabel($issuance->acknowledgement->status),
                        'status_color'         => IssuanceStatus::getColor($issuance->acknowledgement->status),
                        'acknowledged_at'      => $issuance->acknowledgement->acknowledged_at,
                        'remarks'              => $issuance->acknowledgement->remarks,
                    ] : null,

                    'hardware_users'  => $issuance->hardware
                        ? $issuance->hardware->hardwareUsers->map(fn($hu) => [
                            'user_id'       => $hu->user_id,
                            'user_name'     => $hu->user ? trim($hu->user->EMPNAME) : 'N/A',
                            'date_assigned' => $hu->date_assigned,
                            'remarks'       => $hu->remarks,
                        ])
                        : [],

                    'operations'      => [],
                    'component_count' => 0,
                ];

                if ($isInventoryChange) {
                    $formatted['operations'] = $issuance->componentDetails->map(fn($detail) => [
                        'operation_type'          => $detail->operation_type,
                        'component_type'          => $detail->component_type,
                        'old_component_id'        => $detail->old_component_id,
                        'old_component_condition' => $detail->old_component_condition,
                        'old_component_data'      => $detail->old_component_data,
                        'new_component_id'        => $detail->new_component_id,
                        'new_component_condition' => $detail->new_component_condition,
                        'new_component_data'      => $detail->new_component_data,
                        'reason'                  => $detail->reason,
                        'remarks'                 => $detail->remarks,
                    ]);

                    $formatted['component_count'] = $issuance->componentDetails->count();
                }

                return $formatted;
            });

            return [
                'success'    => true,
                'data'       => $formattedData,
                'pagination' => $result['pagination'],
                'filters'    => $filters,
            ];
        } catch (\Exception $e) {

            Log::error('Failed to get issuance table: ' . $e->getMessage());

            return [
                'success'    => false,
                'message'    => 'Failed to retrieve data: ' . $e->getMessage(),
                'data'       => [],
                'pagination' => [
                    'current_page'  => 1,
                    'total_pages'   => 0,
                    'total_records' => 0,
                    'page_size'     => $filters['pageSize'] ?? 10,
                ],
                'filters' => $filters,
            ];
        }
    }

    /**
     * BUSINESS LOGIC: Acknowledge an issuance
     */
    public function updateAcknowledgementStatus($id, int $employeeId): array
    {
        try {
            $acknowledgement = $this->issuanceRepository->findAcknowledgementByIssuance($id);

            if (!$acknowledgement) {
                return ['success' => false, 'message' => 'Acknowledgement not found', 'status' => 404];
            }

            if ($acknowledgement->status !== 0) {
                return ['success' => false, 'message' => 'Acknowledgement has already been processed', 'status' => 403];
            }

            $issuance = $acknowledgement->issuance;

            if (!$issuance) {
                return ['success' => false, 'message' => 'Linked issuance not found', 'status' => 404];
            }

            $isAssigned = $this->issuanceRepository->isEmployeeAssignedToHardware(
                $issuance->hardware_id,
                $employeeId
            );

            if (!$isAssigned) {
                Log::warning('Unauthorized acknowledgement attempt', [
                    'acknowledgement_id' => $acknowledgement->id,
                    'issuance_id'        => $issuance->id,
                    'hardware_id'        => $issuance->hardware_id,
                    'employee_id'        => $employeeId,
                ]);

                return [
                    'success' => false,
                    'message' => 'You are not authorized to acknowledge this item. Only assigned hardware users can acknowledge.',
                    'status'  => 403,
                ];
            }

            $updateData = [
                'status'          => IssuanceStatus::ACKNOWLEDGED,
                'acknowledged_by' => $employeeId,
                'acknowledged_at' => now(),
            ];

            $this->issuanceRepository->updateAcknowledgement($acknowledgement->id, $updateData);

            Log::info('Acknowledgement status updated', [
                'acknowledgement_id' => $acknowledgement->id,
                'issuance_id'        => $issuance->id,
                'hardware_id'        => $issuance->hardware_id,
                'employee_id'        => $employeeId,
            ]);

            return [
                'success' => true,
                'message' => 'Acknowledgement updated successfully',
                'data'    => [
                    'id'              => $acknowledgement->id,
                    'acknowledged_by' => $employeeId,
                    'status_label'    => IssuanceStatus::getLabel(IssuanceStatus::ACKNOWLEDGED),
                    'status_color'    => IssuanceStatus::getColor(IssuanceStatus::ACKNOWLEDGED),
                    'acknowledged_at' => now(),
                ],
                'status' => 200,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to update acknowledgement: ' . $e->getMessage(), [
                'issuance_id' => $id,
                'employee_id' => $employeeId,
            ]);

            return ['success' => false, 'message' => 'Failed to update acknowledgement: ' . $e->getMessage(), 'status' => 500];
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
                $hardware = $this->hardwareDetailRepository->getHardwareInfo($hostnameData['hostname']);

                if (!$hardware) {
                    throw new \Exception("Hardware not found: {$hostnameData['hostname']}");
                }

                $issuanceNumber = $this->generateIssuanceNumber();

                $issuanceData = [
                    'issuance_number' => $issuanceNumber,
                    'issuance_type'   => 1,
                    'request_number'  => $data['request_number'],
                    'hostname'        => $hardware->hostname ?? $hardware->serial,
                    'hardware_id'     => $hardware->id,
                    'location'        => $hostnameData['location'] ?? $hardware->location,
                    'remarks'         => $hostnameData['remarks'] ?? null,
                    'created_by'      => $createdBy,
                ];

                $acknowledgementData = [
                    'reference_type'  => 1,
                    'acknowledged_by' => null,
                    'status'          => 0,
                    'remarks'         => null,
                ];

                $result = $this->issuanceRepository->createWholeUnitIssuance($issuanceData, $acknowledgementData);

                $this->hardwareUpdateService->updateHardware($hardware->id, [
                    'location'    => $hostnameData['location'] ?? $hardware->location,
                    'date_issued' => now(),
                    'updated_by'  => $createdBy,
                ], $createdBy);

                Log::info('Hardware updated during issuance', [
                    'hardware_id' => $hardware->id,
                    'hostname'    => $hardware->hostname ?? $hardware->serial,
                    'location'    => $hostnameData['location'],
                    'updated_by'  => $createdBy,
                ]);

                $results[] = [
                    'issuance_id'     => $result['issuance']->id,
                    'issuance_number' => $issuanceNumber,
                    'hostname'        => $hardware->hostname ?? $hardware->serial,
                    'hardware_id'     => $hardware->id,
                ];
            }

            return [
                'success' => true,
                'message' => 'Items issued successfully',
                'data'    => $results,
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
     * BUSINESS LOGIC: Process component maintenance
     */
    public function processComponentMaintenance(array $operations, int $createdBy): array
    {
        try {
            $this->validateOperations($operations);

            $firstOp  = $operations[0];
            $hardware = $this->hardwareDetailRepository->getHardwareInfoById($firstOp['hardware_id']);

            if (!$hardware) {
                throw new \Exception("Hardware not found: {$firstOp['hardware_id']}");
            }

            $issuedTo = $firstOp['issued_to'] ?? $hardware->issued_to ?? $createdBy;

            $processedOperations = [];
            foreach ($operations as $operation) {
                $operation['employee_id'] = $createdBy;
                $operation['issued_to']   = $issuedTo;
                $processedOperations[]    = $this->processSingleOperation($operation, $hardware, $createdBy);
            }

            $issuanceNumber = $this->generateIssuanceNumber();

            $issuanceData = $this->prepareIssuanceData(
                $issuanceNumber,
                $processedOperations,
                $hardware,
                $createdBy,
                $issuedTo
            );

            $componentDetailsData = [];
            foreach ($processedOperations as $operation) {
                $componentDetailsData[] = $this->prepareComponentDetailData($operation, $hardware);
            }

            $acknowledgementData = $this->prepareAcknowledgementData($hardware);

            $result = $this->issuanceRepository->createComponentMaintenanceIssuance(
                $issuanceData,
                $componentDetailsData,
                $acknowledgementData
            );

            Log::info('Component maintenance processed successfully', [
                'issuance_id'     => $result['issuance']->id,
                'issuance_number' => $issuanceNumber,
                'operation_count' => count($processedOperations),
                'hardware_id'     => $hardware->id,
                'created_by'      => $createdBy,
            ]);

            return [
                'success' => true,
                'message' => 'Component maintenance completed successfully',
                'data'    => [
                    'issuance_id'          => $result['issuance']->id,
                    'issuance_number'      => $issuanceNumber,
                    'hardware_id'          => $hardware->id,
                    'hostname'             => $hardware->hostname ?? $hardware->serial,
                    'operation_count'      => count($processedOperations),
                    'acknowledgement_id'   => $result['acknowledgement']->id,
                    'acknowledgement_status' => $result['acknowledgement']->status,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Component maintenance processing failed: ' . $e->getMessage(), [
                'operations' => $operations,
                'created_by' => $createdBy,
                'trace'      => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process component maintenance: ' . $e->getMessage(),
            ];
        }
    }

    protected function validateOperations(array $operations): void
    {
        if (empty($operations)) throw new \Exception('No operations provided');

        $hardwareId = $operations[0]['hardware_id'] ?? null;
        if (!$hardwareId) throw new \Exception('Hardware ID is required');

        foreach ($operations as $index => $operation) {
            if (!isset($operation['operation'])) throw new \Exception("Operation type missing at index {$index}");
            if (!in_array($operation['operation'], ['add', 'replace', 'remove'])) throw new \Exception("Invalid operation type at index {$index}");
            if (!isset($operation['component_type'])) throw new \Exception("Component type missing at index {$index}");
            if (!in_array($operation['component_type'], ['part', 'software'])) throw new \Exception("Invalid component type at index {$index}");
            if ($operation['hardware_id'] != $hardwareId) throw new \Exception("All operations must be for the same hardware");
        }
    }

    protected function processSingleOperation(array $operation, $hardware, int $employeeId): array
    {
        $result = [
            'operation'      => $operation['operation'],
            'component_type' => $operation['component_type'],
            'hardware_id'    => $hardware->id,
            'hostname'       => $hardware->hostname ?? $hardware->serial,
            'issued_to'      => $operation['employee_id'] ?? $hardware->issued_to ?? $employeeId,
            'reason'         => $operation['reason'] ?? null,
            'remarks'        => $operation['remarks'] ?? null,
        ];

        return match ($operation['operation']) {
            'add'     => $this->processAddOperation($operation, $hardware, $employeeId, $result),
            'replace' => $this->processReplaceOperation($operation, $hardware, $employeeId, $result),
            'remove'  => $this->processRemoveOperation($operation, $hardware, $employeeId, $result),
            default   => throw new \Exception("Unknown operation: {$operation['operation']}"),
        };
    }

    protected function processAddOperation(array $operation, $hardware, int $employeeId, array $result): array
    {
        $componentData = $this->hardwareUpdateService->addComponent([
            'hardware_id'        => $hardware->id,
            'component_type'     => $operation['component_type'],
            'employee_id'        => $employeeId,
            'new_part_type'      => $operation['new_part_type'] ?? null,
            'new_brand'          => $operation['new_brand'] ?? null,
            'new_model'          => $operation['new_model'] ?? null,
            'new_specifications' => $operation['new_specifications'] ?? null,
            'new_condition'      => $operation['new_condition'] ?? 'New',
            'new_serial_number'  => $operation['new_serial_number'] ?? null,
            'new_software_name'  => $operation['new_software_name'] ?? null,
            'new_software_type'  => $operation['new_software_type'] ?? null,
            'new_version'        => $operation['new_version'] ?? null,
            'new_license_key'    => $operation['new_license_key'] ?? null,
            'new_account_user'   => $operation['new_account_user'] ?? null,
            'new_account_password' => $operation['new_account_password'] ?? null,
            'reason'             => $operation['reason'] ?? null,
        ]);

        return array_merge($result, [
            'new_component_id'   => $componentData->id,
            'new_component_data' => $this->extractComponentData($operation, $componentData),
            'new_condition'      => $operation['new_condition'] ?? 'New',
            'new_serial_number'  => $operation['new_serial_number'] ?? null,
        ]);
    }

    protected function processReplaceOperation(array $operation, $hardware, int $employeeId, array $result): array
    {
        $oldComponentData = $this->getOldComponentData($operation['component_id'], $operation['component_type']);

        $componentData = $this->hardwareUpdateService->replaceComponent([
            'hardware_id'              => $hardware->id,
            'component_id'             => $operation['component_id'],
            'component_type'           => $operation['component_type'],
            'employee_id'              => $employeeId,
            'old_component_condition'  => $operation['old_component_condition'] ?? 'working',
            'reason'                   => $operation['reason'] ?? 'Component replacement',
            'remarks'                  => $operation['remarks'] ?? null,
            'replacement_part_type'    => $operation['replacement_part_type'] ?? null,
            'replacement_brand'        => $operation['replacement_brand'] ?? null,
            'replacement_model'        => $operation['replacement_model'] ?? null,
            'replacement_specifications' => $operation['replacement_specifications'] ?? null,
            'replacement_condition'    => $operation['replacement_condition'] ?? 'New',
            'replacement_serial_number' => $operation['replacement_serial_number'] ?? null,
            'replacement_software_name' => $operation['replacement_software_name'] ?? $operation['replacement_sw_software_name'] ?? null,
            'replacement_software_type' => $operation['replacement_software_type'] ?? $operation['replacement_sw_software_type'] ?? null,
            'replacement_version'      => $operation['replacement_version'] ?? $operation['replacement_sw_version'] ?? null,
            'replacement_license_key'  => $operation['replacement_license_key'] ?? $operation['replacement_sw_license_key'] ?? null,
            'replacement_account_user' => $operation['replacement_account_user'] ?? $operation['replacement_sw_account_user'] ?? null,
            'replacement_account_password' => $operation['replacement_account_password'] ?? $operation['replacement_sw_account_password'] ?? null,
        ]);

        return array_merge($result, [
            'old_component_id'        => $operation['component_id'],
            'old_component_condition' => $operation['old_component_condition'] ?? 'working',
            'old_component_data'      => $oldComponentData,
            'new_component_id'        => $componentData->id,
            'new_component_data'      => $this->extractComponentData($operation, $componentData),
            'new_condition'           => $operation['replacement_condition'] ?? 'New',
            'new_serial_number'       => $operation['replacement_serial_number'] ?? null,
        ]);
    }

    protected function processRemoveOperation(array $operation, $hardware, int $employeeId, array $result): array
    {
        $oldComponentData = $this->getOldComponentData($operation['component_id'], $operation['component_type']);

        $this->hardwareUpdateService->removeComponent([
            'hardware_id'      => $hardware->id,
            'component_id'     => $operation['component_id'],
            'component_type'   => $operation['component_type'],
            'employee_id'      => $employeeId,
            'removal_reason'   => $operation['reason'] ?? 'Component removal',
            'removal_condition' => $operation['condition'] ?? 'working',
            'removal_remarks'  => $operation['remarks'] ?? null,
        ]);

        return array_merge($result, [
            'old_component_id'        => $operation['component_id'],
            'old_component_condition' => $operation['condition'] ?? 'working',
            'old_component_data'      => $oldComponentData,
        ]);
    }

    protected function getOldComponentData(int $componentId, string $componentType): ?array
    {
        if ($componentType === 'part') {
            $component = $this->hardwareDetailRepository->getHardwarePartById($componentId);
            if ($component) {
                return [
                    'id'             => $component->id,
                    'part_type'      => $component->part_type,
                    'brand'          => $component->brand,
                    'model'          => $component->model,
                    'specifications' => $component->specifications,
                    'serial_number'  => $component->serial_number,
                    'condition'      => $component->condition,
                    'installed_date' => $component->installed_date,
                ];
            }
        } else {
            $component = $this->hardwareDetailRepository->getHardwareSoftwareById($componentId);
            if ($component) {
                $component->loadMissing(['softwareInventory', 'softwareLicense']);
                return [
                    'id'               => $component->id,
                    'software_name'    => $component->softwareInventory->software_name ?? null,
                    'software_type'    => $component->softwareInventory->software_type ?? null,
                    'version'          => $component->softwareInventory->version ?? null,
                    'license_key'      => $component->softwareLicense->license_key ?? null,
                    'account_user'     => $component->softwareLicense->account_user ?? null,
                    'installation_date' => $component->installation_date,
                ];
            }
        }

        return null;
    }

    protected function extractComponentData(array $operation, $component): array
    {
        if ($operation['component_type'] === 'part') {
            return [
                'part_type'      => $operation['new_part_type'] ?? $operation['replacement_part_type'] ?? $component->part_type,
                'brand'          => $operation['new_brand'] ?? $operation['replacement_brand'] ?? $component->brand,
                'model'          => $operation['new_model'] ?? $operation['replacement_model'] ?? $component->model,
                'specifications' => $operation['new_specifications'] ?? $operation['replacement_specifications'] ?? $component->specifications,
                'serial_number'  => $operation['new_serial_number'] ?? $operation['replacement_serial_number'] ?? $component->serial_number,
                'condition'      => $operation['new_condition'] ?? $operation['replacement_condition'] ?? $component->condition,
            ];
        }

        return [
            'software_name' => $operation['new_software_name'] ?? $operation['replacement_software_name'] ?? $operation['replacement_sw_software_name'] ?? $component->softwareInventory->software_name ?? null,
            'software_type' => $operation['new_software_type'] ?? $operation['replacement_software_type'] ?? $operation['replacement_sw_software_type'] ?? $component->softwareInventory->software_type ?? null,
            'version'       => $operation['new_version'] ?? $operation['replacement_version'] ?? $operation['replacement_sw_version'] ?? $component->softwareInventory->version ?? null,
            'license_key'   => $operation['new_license_key'] ?? $operation['replacement_license_key'] ?? $operation['replacement_sw_license_key'] ?? $component->softwareLicense->license_key ?? null,
            'account_user'  => $operation['new_account_user'] ?? $operation['replacement_account_user'] ?? $operation['replacement_sw_account_user'] ?? $component->softwareLicense->account_user ?? null,
        ];
    }

    protected function prepareIssuanceData(string $issuanceNumber, array $operations, $hardware, int $createdBy, string $issuedTo): array
    {
        return [
            'issuance_number' => $issuanceNumber,
            'issuance_type'   => 2,
            'issued_to'       => $issuedTo,
            'hostname'        => $hardware->hostname ?? $hardware->serial,
            'hardware_id'     => $hardware->id,
            'location'        => $hardware->location,
            'remarks'         => 'Component maintenance operation',
            'created_by'      => $createdBy,
        ];
    }

    protected function prepareComponentDetailData(array $operation, $hardware): array
    {
        $detailData = [
            'operation_type' => $operation['operation'],
            'component_type' => $operation['component_type'],
            'reason'         => $operation['reason'] ?? null,
            'remarks'        => $operation['remarks'] ?? null,
        ];

        if (isset($operation['old_component_id'])) {
            $detailData['old_component_id']        = $operation['old_component_id'];
            $detailData['old_component_condition']  = $operation['old_component_condition'] ?? null;
            $detailData['old_component_data']       = $operation['old_component_data'] ?? null;
        }

        if (isset($operation['new_component_id'])) {
            $detailData['new_component_id']        = $operation['new_component_id'];
            $detailData['new_component_condition']  = $operation['new_condition'] ?? null;
            $detailData['new_component_data']       = $operation['new_component_data'] ?? null;
        }

        $detailData['hardware_changes'] = [
            'hardware_id'    => $hardware->id,
            'hostname'       => $hardware->hostname ?? $hardware->serial,
            'operation'      => $operation['operation'],
            'component_type' => $operation['component_type'],
            'performed_at'   => now()->toDateTimeString(),
        ];

        return $detailData;
    }

    protected function prepareAcknowledgementData($hardware): array
    {
        return [
            'reference_type'  => 1,
            'acknowledged_by' => null,
            'status'          => 0,
            'remarks'         => "Component maintenance on {$hardware->hostname}",
        ];
    }
}
