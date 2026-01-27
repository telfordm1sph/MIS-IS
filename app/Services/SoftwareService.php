<?php

namespace App\Services;

use App\Constants\Status;
use App\Repositories\SoftwareRepository;

class SoftwareService
{
    protected SoftwareRepository $softwareRepository;

    public function __construct(SoftwareRepository $softwareRepository)
    {
        $this->softwareRepository = $softwareRepository;
    }

    public function getSoftwareTable(array $filters): array
    {
        // Start query from repository
        $tableQuery = $this->softwareRepository->query();

        // ----- Apply status filter -----
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $tableQuery->where('status', $filters['status']);
        }

        // ----- Apply search filter -----
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $tableQuery->where(function ($q) use ($search) {
                $q->where('software_name', 'like', "%$search%")
                    ->orWhere('software_type', 'like', "%$search%")
                    ->orWhere('version', 'like', "%$search%")
                    ->orWhere('publisher', 'like', "%$search%");
            });
        }

        // ----- Sorting -----
        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';
        $tableQuery->orderBy($sortField, $sortOrder);

        // ----- Pagination -----
        $page     = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $tableQuery->paginate($pageSize, ['*'], 'page', $page);

        $data = $paginated->items(); // Get current page data

        // Optional: Status counts (uncomment if needed)
        // $statusCounts = $this->softwareRepository->query()
        //     ->select('status', \DB::raw('count(*) as count'))
        //     ->groupBy('status')
        //     ->pluck('count', 'status')
        //     ->toArray();

        return [
            'data' => $data,
            'pagination' => [
                'current'     => $paginated->currentPage(),
                'currentPage' => $paginated->currentPage(),
                'lastPage'    => $paginated->lastPage(),
                'total'       => $paginated->total(),
                'perPage'     => $paginated->perPage(),
                'pageSize'    => $paginated->perPage(),
            ],
            // 'statusCounts' => $statusCounts,
            'filters' => $filters,
        ];
    }
    public function getSoftwareLogs(int $softwareId, int $page = 1, int $perPage = 10): array
    {
        // Get the query from the repository
        $logsQuery = $this->softwareRepository->getLogsQuery($softwareId);

        // Total logs
        $total = $logsQuery->count();

        // Apply pagination
        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Format logs
        $formattedLogs = $this->softwareRepository->formatLogs($logs);

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
    public function create(array $data)
    {
        return $this->softwareRepository->create($data);
    }

    public function update(int $id, array $data)
    {
        return $this->softwareRepository->update($id, $data);
    }


    public function delete(int $id): bool
    {
        return $this->softwareRepository->delete($id);
    }
    public function findById(int $id)
    {
        return $this->softwareRepository->findById($id);
    }
}
