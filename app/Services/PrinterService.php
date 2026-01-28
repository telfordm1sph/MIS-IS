<?php

namespace App\Services;

use App\Constants\PrinterStatus;
use App\Repositories\PrinterRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrinterService
{
    protected PrinterRepository $printerRepository;

    public function __construct(PrinterRepository $printerRepository)
    {
        $this->printerRepository = $printerRepository;
    }

    /**
     * Get printer table data with filters
     * BUSINESS LOGIC: Process and format data
     */
    public function getPrinterTable(array $filters): array
    {
        $query = $this->printerRepository->query();

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

        $page = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $query->paginate($pageSize, ['*'], 'page', $page);


        $data = array_map(function ($printer) {

            $printerArray = $printer->toArray();


            $status = $printerArray['status'] ?? null;

            return array_merge($printerArray, [
                'status_label' => PrinterStatus::getLabel($status),
                'status_color' => PrinterStatus::getColor($status),
            ]);
        }, $paginated->items());

        return [
            'data' => $data,
            'pagination' => [
                'current' => $paginated->currentPage(),
                'currentPage' => $paginated->currentPage(),
                'lastPage' => $paginated->lastPage(),
                'total' => $paginated->total(),
                'perPage' => $paginated->perPage(),
                'pageSize' => $paginated->perPage(),
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
        // Get the query from the repository
        $logsQuery = $this->printerRepository->getLogsQuery($printerId);

        // Total logs
        $total = $logsQuery->count();

        // Apply pagination
        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Format logs
        $formattedLogs = $this->printerRepository->formatLogs($logs);

        $lastPage = ceil($total / $perPage);

        return [
            'data' => $formattedLogs,
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'has_more' => $page < $lastPage,
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
                'employee_id' => $employeeId,
                'printer_name' => $data['printer_name'] ?? null,
            ]);

            // Add employee tracking
            $data['created_by'] = $employeeId;
            $data['updated_by'] = $employeeId;

            $printer = $this->printerRepository->create($data);

            Log::info('Printer created successfully', [
                'printer_id' => $printer->id,
                'employee_id' => $employeeId,
            ]);

            return $printer;
        } catch (\Exception $e) {
            Log::error('Printer creation failed in service', [
                'employee_id' => $employeeId,
                'error' => $e->getMessage(),
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
                'printer_id' => $id,
                'employee_id' => $employeeId,
            ]);

            // Add employee tracking
            $data['updated_by'] = $employeeId;

            $printer = $this->printerRepository->update($id, $data);

            if ($printer) {
                Log::info('Printer updated successfully', [
                    'printer_id' => $id,
                    'employee_id' => $employeeId,
                ]);
            }

            return $printer;
        } catch (\Exception $e) {
            Log::error('Printer update failed in service', [
                'printer_id' => $id,
                'employee_id' => $employeeId,
                'error' => $e->getMessage(),
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
            Log::info('Deleting printer', [
                'printer_id' => $id,
                'employee_id' => $employeeId,
            ]);

            $result = $this->printerRepository->delete($id);

            if ($result) {
                Log::info('Printer deleted successfully', [
                    'printer_id' => $id,
                    'employee_id' => $employeeId,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Printer deletion failed in service', [
                'printer_id' => $id,
                'employee_id' => $employeeId,
                'error' => $e->getMessage(),
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
}
