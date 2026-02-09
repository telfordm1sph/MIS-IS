<?php

namespace App\Services;

use App\Constants\PrinterStatus;
use App\Repositories\CCTVRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CCTVService
{
    protected CCTVRepository $cctvRepository;

    public function __construct(CCTVRepository $cctvRepository)
    {
        $this->cctvRepository = $cctvRepository;
    }

    /**
     * Get cctv table data with filters
     * BUSINESS LOGIC: Process and format data
     */
    public function getCCTVTable(array $filters): array
    {
        $query = $this->cctvRepository->query();

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('camera_name', 'like', "%$search%")
                    ->orWhere('ip_address', 'like', "%$search%")
                    ->orWhere('channel', 'like', "%$search%")
                    ->orWhere('location', 'like', "%$search%")
                    ->orWhere('control_no', 'like', "%$search%")
                    ->orWhere('location_ip', 'like', "%$search%");
            });
        }

        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        $page = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $query->paginate($pageSize, ['*'], 'page', $page);


        $data = array_map(function ($cctv) {

            $cctvArray = $cctv->toArray();


            $status = $cctvArray['status'] ?? null;

            return array_merge($cctvArray, [
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
     * Get cctv logs with pagination
     * BUSINESS LOGIC: Fetch and format logs
     */
    public function getCCTVLogs(int $cctvId, int $page = 1, int $perPage = 10): array
    {
        // Get the query from the repository
        $logsQuery = $this->cctvRepository->getLogsQuery($cctvId);

        // Total logs
        $total = $logsQuery->count();

        // Apply pagination
        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Format logs
        $formattedLogs = $this->cctvRepository->formatLogs($logs);

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
     * Create new cctv
     * BUSINESS LOGIC: Handle creation with employee tracking
     */
    public function create(array $data, int $employeeId)
    {
        try {
            Log::info('Creating cctv', [
                'employee_id' => $employeeId,
                'camera_name' => $data['camera_name'] ?? null,
            ]);

            // Add employee tracking
            $data['created_by'] = $employeeId;
            $data['updated_by'] = $employeeId;

            $cctv = $this->cctvRepository->create($data);

            Log::info('CCTV created successfully', [
                'cctv_id' => $cctv->id,
                'employee_id' => $employeeId,
            ]);

            return $cctv;
        } catch (\Exception $e) {
            Log::error('CCTV creation failed in service', [
                'employee_id' => $employeeId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Update cctv
     * BUSINESS LOGIC: Handle update with employee tracking
     */
    public function update(int $id, array $data, int $employeeId)
    {
        try {
            Log::info('Updating cctv', [
                'id' => $id,
                'employee_id' => $employeeId,
            ]);

            // Add employee tracking
            $data['updated_by'] = $employeeId;

            $cctv = $this->cctvRepository->update($id, $data);

            if ($cctv) {
                Log::info('CCTV updated successfully', [
                    'id' => $id,
                    'employee_id' => $employeeId,
                ]);
            }

            return $cctv;
        } catch (\Exception $e) {
            Log::error('CCTV update failed in service', [
                'id' => $id,
                'employee_id' => $employeeId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Delete cctv
     * BUSINESS LOGIC: Handle deletion with logging
     */
    public function delete(int $id, int $employeeId): bool
    {
        try {
            Log::info('Deleting cctv', [
                'id' => $id,
                'employee_id' => $employeeId,
            ]);

            $result = $this->cctvRepository->delete($id);

            if ($result) {
                Log::info('CCTV deleted successfully', [
                    'id' => $id,
                    'employee_id' => $employeeId,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('CCTV deletion failed in service', [
                'id' => $id,
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
        return $this->cctvRepository->findById($id);
    }
}
