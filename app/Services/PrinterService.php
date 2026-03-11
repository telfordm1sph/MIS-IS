<?php

namespace App\Services;

use App\Constants\PrinterStatus;
use App\Repositories\PrinterRepository;
use App\Repositories\HardwareRepository;
use App\Services\Traits\PartOperationsTrait;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrinterService
{
    use PartOperationsTrait;

    protected PrinterRepository $printerRepository;
    protected HardwareRepository $hardwareRepository;

    public function __construct(PrinterRepository $printerRepository, HardwareRepository $hardwareRepository)
    {
        $this->printerRepository = $printerRepository;
        $this->hardwareRepository = $hardwareRepository;
    }

    // PartOperationsTrait abstract method implementations
    protected function getEntityType($entity): string
    {
        return 'printer';
    }

    protected function getEntityName($entity): string
    {
        return $entity->printer_name;
    }

    protected function getEntityId($entity): int
    {
        return $entity->id;
    }

    protected function createPartRecord($entity, array $partData, string $condition, int $inventoryId, int $employeeId)
    {
        $printerPartData = [
            'printer_id'          => $entity->id,
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

        return $this->printerRepository->createPrinterPart($printerPartData);
    }

    protected function createPartRecordManual($entity, array $partData, int $employeeId)
    {
        $printerPartData = [
            'printer_id'     => $entity->id,
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

        return $this->printerRepository->createPrinterPart($printerPartData);
    }

    protected function findPartRecordById(int $id)
    {
        return $this->printerRepository->findPrinterPartById($id);
    }

    protected function updatePartRecord(int $id, array $data): void
    {
        $this->printerRepository->updatePrinterPart($id, $data);
    }

    protected function logPartAddition($entity, $partRecord, $part, string $condition, int $employeeId): void
    {
        $this->printerRepository->logPrinterPartChange(
            $entity,
            $partRecord,
            'part_added',
            $employeeId,
            "Added {$part->part_type} - {$part->brand} {$part->model} ({$condition})"
        );
    }

    protected function logPartRemoval($entity, $partRecord, $part, string $condition, string $removalReason, int $employeeId): void
    {
        $this->printerRepository->logPrinterPartChange(
            $entity,
            $partRecord,
            'part_removed',
            $employeeId,
            "Removed {$part->part_type} - {$part->brand} {$part->model} ({$condition})"
        );
    }

    protected function logPartAdditionManual($entity, $partRecord, string $partType, string $brand, string $model, int $employeeId): void
    {
        $this->printerRepository->logPrinterPartChange(
            $entity,
            $partRecord,
            'part_added_manual',
            $employeeId,
            "Added {$partType} - {$brand} {$model} (Manual)"
        );
    }

    protected function getRemovedStatus(): string
    {
        return 'removed';
    }

    protected function getEntityTypeFromPartRecord($partRecord): string
    {
        return 'printer';
    }

    protected function getEntityTypeFromPartData(array $partData): string
    {
        return 'printer';
    }

    /**
     * Get printer table data with filters
     * BUSINESS LOGIC: Process and format data
     */
    public function getPrinterTable(array $filters): array
    {
        $query = $this->printerRepository->query()->with('locationDetail');

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('printer_name', 'like', "%$search%")
                    ->orWhere('ip_address', 'like', "%$search%")
                    ->orWhere('printer_type', 'like', "%$search%")
                    ->orWhere('location', 'like', "%$search%")
                    ->orWhere('brand', 'like', "%$search%")
                    ->orWhere('model', 'like', "%$search%")
                    ->orWhere('serial_number', 'like', "%$search%");
            });
        }

        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        $page     = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $query->paginate($pageSize, ['*'], 'page', $page);

        $data = $paginated->getCollection()->map(function ($printer) {
            return [
                'id'             => $printer->id,
                'printer_name'   => $printer->printer_name,
                'ip_address'     => $printer->ip_address,
                'printer_type'   => $printer->printer_type,
                'brand'          => $printer->brand,
                'model'          => $printer->model,
                'serial_number'  => $printer->serial_number,
                'status'         => $printer->status,
                'status_label'   => PrinterStatus::getLabel($printer->status),
                'status_color'   => PrinterStatus::getColor($printer->status),
                'location_name'  => $printer->locationDetail?->location_name,
            ];
        })->toArray();

        return [
            'data'       => $data,
            'pagination' => [
                'current'     => $paginated->currentPage(),
                'currentPage' => $paginated->currentPage(),
                'lastPage'    => $paginated->lastPage(),
                'total'       => $paginated->total(),
                'perPage'     => $paginated->perPage(),
                'pageSize'    => $paginated->perPage(),
            ],
            'filters' => $filters,
        ];
    }

    /**
     * Get printer logs with pagination
     * BUSINESS LOGIC: Fetch and format logs
     */
    public function getPrinterLogs(int $printerId, int $page = 1, int $perPage = 10): array
    {
        $logsQuery = $this->printerRepository->getLogsQuery($printerId);
        $total     = $logsQuery->count();

        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $formattedLogs = $this->printerRepository->formatLogs($logs);
        $lastPage      = ceil($total / $perPage);

        return [
            'data'        => $formattedLogs,
            'current_page' => $page,
            'last_page'   => $lastPage,
            'per_page'    => $perPage,
            'total'       => $total,
            'has_more'    => $page < $lastPage,
        ];
    }

    /**
     * Create new printer
     * BUSINESS LOGIC: Handle creation with employee tracking
     */
    public function create(array $data, int $employeeId)
    {
        try {
            Log::info('Creating printer', [
                'employee_id'  => $employeeId,
                'printer_name' => $data['printer_name'] ?? null,
            ]);

            $issuedTo = $this->extractIssuedTo($data);

            $dbData = [
                'printer_name'    => $data['printer_name'],
                'ip_address'      => $data['ip_address'] ?? null,
                'printer_type'    => $data['printer_type'] ?? null,
                'printer_category' => $data['printer_category'] ?? null,
                'location'        => $data['location'] ?? null,
                'brand'           => $data['brand'] ?? null,
                'model'           => $data['model'] ?? null,
                'serial_number'   => $data['serial_number'] ?? null,
                'dpi'             => $data['dpi'] ?? null,
                'category_status' => $data['category_status'] ?? null,
                'toner'           => $data['toner'] ?? null,
                'supplier'        => $data['supplier'] ?? null,
                'status'          => $data['status'] ?? null,
                'created_by'      => $employeeId,
                'updated_by'      => $employeeId,
            ];

            $printer = $this->printerRepository->create($dbData);

            if (!empty($issuedTo)) {
                $this->syncAssignedUsers($printer, $issuedTo, $employeeId);
            }

            Log::info('Printer created successfully', [
                'printer_id'  => $printer->id,
                'employee_id' => $employeeId,
            ]);

            return $printer;
        } catch (\Exception $e) {
            Log::error('Printer creation failed in service', [
                'employee_id' => $employeeId,
                'error'       => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Update printer
     * BUSINESS LOGIC: Handle update with employee tracking
     */
    public function update(int $id, array $data, int $employeeId)
    {
        try {
            Log::info('Updating printer', [
                'printer_id'  => $id,
                'employee_id' => $employeeId,
            ]);

            $issuedTo = $this->extractIssuedTo($data);

            $dbData = [
                'printer_name'    => $data['printer_name'],
                'ip_address'      => $data['ip_address'] ?? null,
                'printer_type'    => $data['printer_type'] ?? null,
                'printer_category' => $data['printer_category'] ?? null,
                'location'        => $data['location'] ?? null,
                'brand'           => $data['brand'] ?? null,
                'model'           => $data['model'] ?? null,
                'serial_number'   => $data['serial_number'] ?? null,
                'dpi'             => $data['dpi'] ?? null,
                'category_status' => $data['category_status'] ?? null,
                'toner'           => $data['toner'] ?? null,
                'supplier'        => $data['supplier'] ?? null,
                'status'          => $data['status'] ?? null,
                'created_by'      => $employeeId,
                'updated_by'      => $employeeId,
            ];

            $printer = $this->printerRepository->update($id, $dbData);

            if ($printer && $issuedTo !== null) {
                $this->syncAssignedUsers($printer, $issuedTo, $employeeId);
            }

            if ($printer) {
                Log::info('Printer updated successfully', [
                    'printer_id'  => $id,
                    'employee_id' => $employeeId,
                ]);
            }

            return $printer;
        } catch (\Exception $e) {
            Log::error('Printer update failed in service', [
                'printer_id'  => $id,
                'employee_id' => $employeeId,
                'error'       => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Delete printer
     * BUSINESS LOGIC: Handle deletion with logging
     */
    public function delete(int $id, int $employeeId): bool
    {
        try {
            Log::info('Deleting printer', ['printer_id' => $id, 'employee_id' => $employeeId]);

            $result = $this->printerRepository->delete($id);

            if ($result) {
                Log::info('Printer deleted successfully', ['printer_id' => $id, 'employee_id' => $employeeId]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Printer deletion failed in service', [
                'printer_id'  => $id,
                'employee_id' => $employeeId,
                'error'       => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Find printer by ID
     */
    public function findById(int $id)
    {
        return $this->printerRepository->findById($id);
    }

    /**
     * Sync assigned users for a printer — mirrors HardwareUpdateService::syncAssignedUsers
     * Adds users in $userIds not currently assigned, removes those no longer in the list.
     */
    public function syncAssignedUsers($printer, array $userIds, int $employeeId): void
    {
        $currentUserIds = $this->printerRepository->getAssignedUserIds($printer->id);

        $toAdd    = array_diff($userIds, $currentUserIds);
        $toRemove = array_diff($currentUserIds, $userIds);

        if (!empty($toRemove)) {
            $this->printerRepository->removeAssignedUsers($printer->id, $toRemove);
        }

        foreach ($toAdd as $userId) {
            $this->printerRepository->assignUser($printer->id, $userId, $employeeId);
        }
    }

    /**
     * Extract and remove assignedUsersIds from the data array.
     * Returns the array if present (even if empty), null if the key was never sent.
     */
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
}
