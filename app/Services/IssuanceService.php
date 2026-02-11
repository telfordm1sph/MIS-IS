<?php

namespace App\Services;

use App\Constants\IssuanceStatus;
use App\Repositories\HardwareDetailRepository;
use App\Repositories\IssuanceRepository;

use Illuminate\Support\Facades\DB;
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
    /**
     * Acknowledge an issuance - simplified method
     * Automatically sets status to ACKNOWLEDGED (1) when user clicks acknowledge
     * 
     * @param int $issuanceId - The ID from the issuance table
     * @param int $employeeId - The employee attempting to acknowledge
     */
    public function acknowledgeIssuance($issuanceId, $employeeId)
    {
        DB::beginTransaction();
        try {
            // Find the issuance
            $issuance = $this->issuanceRepository->query()->find($issuanceId);

            if (!$issuance) {
                return [
                    'success' => false,
                    'message' => 'Issuance not found',
                    'status' => 404,
                ];
            }

            // Get the acknowledgement record
            $acknowledgement = $issuance->acknowledgement;

            if (!$acknowledgement) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement record not found',
                    'status' => 404,
                ];
            }

            // Check if already acknowledged
            if ($acknowledgement->status == IssuanceStatus::ACKNOWLEDGED) {
                return [
                    'success' => false,
                    'message' => 'This issuance has already been acknowledged',
                    'status' => 403,
                ];
            }

            // Check if the employee is allowed to acknowledge
            if ($acknowledgement->acknowledged_by != $employeeId) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to acknowledge this item',
                    'status' => 403,
                ];
            }

            // Update to acknowledged status
            $updated = $this->issuanceRepository->updateAcknowledgement($acknowledgement->id, [
                'status' => IssuanceStatus::ACKNOWLEDGED,
                'acknowledged_at' => now(),
                'remarks' => 'Acknowledged via system',
            ]);

            DB::commit();

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
            DB::rollBack();
            Log::error('Failed to acknowledge issuance: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to acknowledge issuance: ' . $e->getMessage(),
                'status' => 500,
            ];
        }
    }
    /**
     * Create whole unit issuance
     */
    public function createWholeUnitIssuance(array $data, $createdBy)
    {
        DB::beginTransaction();
        try {
            $results = [];

            foreach ($data['hostnames'] as $hostnameData) {
                // Reuse existing hardware details method
                $hardware = $this->hardwareDetailRepository->getHardwareInfo($hostnameData['hostname']);

                if (!$hardware) {
                    throw new \Exception("Hardware not found: {$hostnameData['hostname']}");
                }

                // Create issuance record
                $issuance = $this->issuanceRepository->createIssuance([
                    'request_number' => $data['request_number'],
                    'issued_to' => $hostnameData['issued_to'],
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'location' => $hostnameData['location'] ?? null,
                    'remarks' => $hostnameData['remarks'] ?? null,
                    'created_by' => $createdBy,
                ]);

                // Update hardware location and issued_to
                $this->hardwareUpdateService->updateHardware($hardware->id, [
                    'issued_to' => $hostnameData['issued_to'],
                    'location' => $hostnameData['location'] ?? $hardware->location,
                    'date_issued' => now(),
                    'updated_by' => $createdBy,
                ], $createdBy);

                // Create acknowledgement
                $this->issuanceRepository->createAcknowledgement([
                    'reference_type' => 1, // Issuance (whole unit)
                    'reference_id' => $issuance->id,
                    'acknowledged_by' => $hostnameData['issued_to'],
                    'status' => 0, // Pending
                    'remarks' => null,
                ]);

                Log::info("Hardware updated during issuance", [
                    'hardware_id' => $hardware->id,
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'issued_to' => $hostnameData['issued_to'],
                    'location' => $hostnameData['location'],
                    'updated_by' => $createdBy,
                ]);

                $results[] = [
                    'issuance_id' => $issuance->id,
                    'hostname' => $hardware->hostname ?? $hardware->serial,
                    'hardware_id' => $hardware->id,
                ];
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Items issued successfully',
                'data' => $results,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Issuance creation failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to create issuance: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create individual part/software issuance
     */
    public function createIndividualItemIssuance(array $data, $createdBy)
    {
        // dd($data);
        DB::beginTransaction();
        try {
            $issuedItems = [];

            foreach ($data['items'] as $itemData) {
                // Create issuance item
                $issuanceItem = $this->issuanceRepository->createIssuanceItem([
                    'issuance_id' => null, // NULL for individual items
                    'item_type' => $itemData['item_type'],
                    'item_id' => $itemData['item_id'],
                    'item_name' => $itemData['item_name'],
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'serial_number' => $itemData['serial_number'] ?? null,
                    'remarks' => $itemData['remarks'] ?? null,
                ]);

                // Create acknowledgement
                $this->issuanceRepository->createAcknowledgement([
                    'reference_type' => 2, // Issuance Item
                    'reference_id' => $issuanceItem->id,
                    'acknowledged_by' => $data['issued_to'],
                    'status' => 0, // Pending
                    'remarks' => null,
                ]);

                $issuedItems[] = $issuanceItem;
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Individual items issued successfully',
                'data' => $issuedItems,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Individual item issuance failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to issue items: ' . $e->getMessage(),
            ];
        }
    }


    /**
     * Create issuance item for component addition
     * Used when adding parts or software to existing hardware
     */
    public function createComponentIssuanceItem(array $data, $createdBy)
    {
        dd($data);
        DB::beginTransaction();
        try {
            // Determine item type and prepare data
            $itemType = $data['component_type']; // 'part' or 'software'
            $hardwareId = $data['hardware_id'];
            $issuedTo = $data['issued_to'];

            // Get hardware info
            $hardware = $this->hardwareDetailRepository->getHardwareInfo($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            $issuanceItemData = [
                'issuance_id' => null,              // NULL for individual component additions
                'hardware_id' => $hardwareId,       // Reference to hardware
                'item_type' => $itemType,           // 'part' or 'software'
                'item_id' => $data['component_id'], // ID of the hardware_part or hardware_software record
                'item_name' => $data['item_name'],
                'description' => $data['description'] ?? null,
                'quantity' => $data['quantity'] ?? 1,
                'serial_number' => $data['serial_number'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $createdBy,
            ];

            // Create issuance item
            $issuanceItem = $this->issuanceRepository->createIssuanceItem($issuanceItemData);

            // Create acknowledgement
            $this->issuanceRepository->createAcknowledgement([
                'reference_type' => 2, // Issuance Item
                'reference_id' => $issuanceItem->id,
                'acknowledged_by' => $issuedTo,
                'status' => 0, // Pending
                'remarks' => "Component added to {$hardware->hostname}",
            ]);

            Log::info("Component issuance item created", [
                'issuance_item_id' => $issuanceItem->id,
                'hardware_id' => $hardwareId,
                'item_type' => $itemType,
                'item_name' => $data['item_name'],
                'issued_to' => $issuedTo,
                'created_by' => $createdBy,
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Component issuance item created successfully',
                'data' => $issuanceItem,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Component issuance item creation failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to create component issuance item: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create issuance item for component replacement
     * Used when replacing parts or software on existing hardware
     */
    public function createComponentReplacementIssuanceItem(array $data, $createdBy)
    {
        // dd($data);
        DB::beginTransaction();
        try {
            // Determine item type and prepare data
            $itemType = $data['component_type']; // 'part' or 'software'
            $hardwareId = $data['hardware_id'];
            $issuedTo = $data['issued_to'];

            // Get hardware info
            $hardware = $this->hardwareDetailRepository->getHardwareInfo($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            $issuanceItemData = [
                'issuance_id' => null,                      // NULL for individual component replacements
                'hardware_id' => $hardwareId,               // Reference to hardware
                'item_type' => $itemType,                   // 'part' or 'software'
                'item_id' => $data['new_component_id'],     // ID of the new hardware_part or hardware_software record
                'item_name' => $data['new_item_name'],
                'description' => $data['description'] ?? "Replacement for {$data['old_item_name']}",
                'quantity' => $data['quantity'] ?? 1,
                'serial_number' => $data['serial_number'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $createdBy,
            ];

            // Create issuance item for the new component
            $issuanceItem = $this->issuanceRepository->createIssuanceItem($issuanceItemData);

            // Create acknowledgement
            $this->issuanceRepository->createAcknowledgement([
                'reference_type' => 2, // Issuance Item
                'reference_id' => $issuanceItem->id,
                'acknowledged_by' => $issuedTo,
                'status' => 0, // Pending
                'remarks' => "Component replacement on {$hardware->hostname}. Old: {$data['old_item_name']}",
            ]);

            Log::info("Component replacement issuance item created", [
                'issuance_item_id' => $issuanceItem->id,
                'hardware_id' => $hardwareId,
                'item_type' => $itemType,
                'old_item' => $data['old_item_name'],
                'new_item' => $data['new_item_name'],
                'issued_to' => $issuedTo,
                'created_by' => $createdBy,
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Component replacement issuance item created successfully',
                'data' => $issuanceItem,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Component replacement issuance item creation failed: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to create component replacement issuance item: ' . $e->getMessage(),
            ];
        }
    }
    /**
     * Get whole unit issuance table
     */
    public function getWholeUnitIssuanceTable(array $filters)
    {
        try {
            $result = $this->issuanceRepository->getWholeUnitIssuancesTable($filters);

            // Format data for frontend
            $formattedData = $result['data']->map(function ($issuance) {
                return [
                    'id' => $issuance->id,
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
                    'page_size' => $filters['pageSize'],
                ],
                'filters' => $filters,
            ];
        }
    }

    /**
     * Get individual item issuance table
     */
    public function getIndividualItemIssuanceTable(array $filters)
    {
        try {
            $result = $this->issuanceRepository->getIndividualItemIssuancesTable($filters);

            // Format data for frontend
            $formattedData = $result['data']->map(function ($item) {
                return [
                    'id' => $item->id,
                    'hardware_id' => $item->hardware_id,
                    'hostname' => $item->hardware ? ($item->hardware->hostname ?? $item->hardware->serial) : 'N/A',
                    'item_type' => $item->item_type,
                    'item_name' => $item->item_name,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'serial_number' => $item->serial_number,
                    'acknowledgement' => $item->acknowledgement ? [
                        'id' => $item->acknowledgement->id,
                        'acknowledged_at' => $item->acknowledgement->acknowledged_at,
                        'status' => $item->acknowledgement->status,
                        'acknowledged_by' => $item->acknowledgement->acknowledged_by,
                        'recipient_name' => $item->acknowledgement->acknowledgedByEmployee
                            ? trim($item->acknowledgement->acknowledgedByEmployee->EMPNAME)
                            : 'N/A',
                        'status_label' => IssuanceStatus::getLabel($item->acknowledgement->status),
                        'status_color' => IssuanceStatus::getColor($item->acknowledgement->status),
                        'acknowledged_at' => $item->acknowledgement->acknowledged_at,
                        'remarks' => $item->acknowledgement->remarks,
                    ] : null,
                    'remarks' => $item->remarks,
                    'created_at' => $item->created_at,
                    'created_by' => $item->created_by,
                    'creator_name' => $item->creator
                        ? trim("{$item->creator->EMPNAME}")
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
            Log::error('Failed to get individual item issuance table: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to retrieve data: ' . $e->getMessage(),
                'data' => [],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 0,
                    'total_records' => 0,
                    'page_size' => $filters['pageSize'],
                ],
                'filters' => $filters,
            ];
        }
    }

    /**
     * Update acknowledgement status
     * Only allows acknowledgement if:
     * - status is 0 (Pending)
     * - acknowledged_by matches employee ID
     */
    public function updateAcknowledgementStatus($id, int $employeeId)
    {
        DB::beginTransaction();
        try {
            $acknowledgement = $this->issuanceRepository->findAcknowledgement($id);

            if (!$acknowledgement) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement not found',
                    'status' => 404,
                ];
            }

            // Check if already acknowledged
            if ($acknowledgement->status !== 0) {
                return [
                    'success' => false,
                    'message' => 'Acknowledgement has already been processed',
                    'status' => 403,
                ];
            }

            // Check if the employee is allowed to acknowledge
            if ($acknowledgement->acknowledged_by != $employeeId) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to acknowledge this item',
                    'status' => 403,
                ];
            }

            $updateData = [
                'status' => 1, // Force to Acknowledged
                'acknowledged_at' => now(),
            ];

            // Update the acknowledgement
            $updated = $this->issuanceRepository->updateAcknowledgement($id, $updateData);

            DB::commit();

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
            DB::rollBack();
            Log::error('Failed to update acknowledgement: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to update acknowledgement: ' . $e->getMessage(),
                'status' => 500,
            ];
        }
    }

    /**
     * Get acknowledgement details
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


    /**
     * Get status text
     */
    private function getStatusText($status)
    {
        return match ((int) $status) {
            0 => 'Pending',
            1 => 'Acknowledged',
            2 => 'Rejected',
            default => 'Unknown'
        };
    }
}
