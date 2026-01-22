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
                $q->where('part_type', 'like', "%$search%")
                    ->orWhere('brand', 'like', "%$search%")
                    ->orWhere('model', 'like', "%$search%")
                    ->orWhere('specifications', 'like', "%$search%")
                    ->orWhere('location', 'like', "%$search%");
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
}
