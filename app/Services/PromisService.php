<?php

namespace App\Services;

use App\Constants\PromisStatus;
use App\Repositories\PromisRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PromisService
{
    protected PromisRepository $promisRepository;
    public function __construct(PromisRepository $promisRepository)
    {
        $this->promisRepository = $promisRepository;
    }

    public function getPromisTable(array $filters): array
    {
        $query = $this->promisRepository->query();

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('promis_name', 'like', "%$search%")
                    ->orWhere('ip_address', 'like', "%$search%")
                    ->orWhere('location', 'like', "%$search%")
                    ->orWhere('model_name', 'like', "%$search%")
                    ->orWhere('monitor', 'like', "%$search%")
                    ->orWhere('mouse', 'like', "%$search%")
                    ->orWhere('keyboard', 'like', "%$search%")
                    ->orWhere('scanner', 'like', "%$search%")
                    ->orWhere('badge_no', 'like', "%$search%");
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
                'status_label' => PromisStatus::getLabel($status),
                'status_color' => PromisStatus::getColor($status),
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
    public function getPromisLogs(int $cctvId, int $page = 1, int $perPage = 10): array
    {
        // Get the query from the repository
        $logsQuery = $this->promisRepository->getLogsQuery($cctvId);

        // Total logs
        $total = $logsQuery->count();

        // Apply pagination
        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Format logs
        $formattedLogs = $this->promisRepository->formatLogs($logs);

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

    public function create(array $data, int $employeeId)
    {
        try {

            // Prepare data for DB
            $dbData = [
                'promis_name' => $data['promis_name'],
                'ip_address' => $data['ip_address'] ?? null,
                'location' => $data['location'] ?? null,
                'model_name' => $data['model_name'] ?? null,
                'monitor' => $data['monitor'] ?? null,
                'mouse' => $data['mouse'] ?? null,
                'keyboard' => $data['keyboard'] ?? null,
                'scanner' => $data['scanner'] ?? null,
                'mouse' => $data['mouse'] ?? null,
                'badge_no' => $data['badge_no'] ?? null,
                'status' => $data['status'] ?? '0', // default if not provided
                'created_by' => $employeeId,
                'updated_by' => $employeeId,
            ];

            // Call repository
            $promis = $this->promisRepository->create($dbData);



            return $promis;
        } catch (\Exception $e) {


            throw $e;
        }
    }

    public function update(int $id, array $data, int $employeeId)
    {
        try {
            $dbData = [
                'promis_name' => $data['promis_name'],
                'ip_address' => $data['ip_address'] ?? null,
                'location' => $data['location'] ?? null,
                'model_name' => $data['model_name'] ?? null,
                'monitor' => $data['monitor'] ?? null,
                'mouse' => $data['mouse'] ?? null,
                'keyboard' => $data['keyboard'] ?? null,
                'scanner' => $data['scanner'] ?? null,
                'mouse' => $data['mouse'] ?? null,
                'badge_no' => $data['badge_no'] ?? null,
                'status' => $data['status'] ?? '0', // default if not provided
                'created_by' => $employeeId,
                'updated_by' => $employeeId,
            ];

            $promis = $this->promisRepository->update($id, $dbData);


            return $promis;
        } catch (\Exception $e) {


            throw $e;
        }
    }
    public function delete(int $id, int $employeeId): bool
    {
        try {

            $result = $this->promisRepository->delete($id);

            return $result;
        } catch (\Exception $e) {

            throw $e;
        }
    }

    /**
     * Find printer by ID
     */
    public function findById(int $id)
    {
        return $this->promisRepository->findById($id);
    }
}
