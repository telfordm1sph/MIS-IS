<?php

namespace App\Services;

use App\Constants\Status;
use App\Repositories\PartsRepository;

class PartsService
{
    protected PartsRepository $partsRepository;

    public function __construct(PartsRepository $partsRepository)
    {
        $this->partsRepository = $partsRepository;
    }

    public function getPartsTable(array $filters): array
    {
        // Start query from repository
        $tableQuery = $this->partsRepository->query();

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
        // $statusCounts = $this->partsRepository->query()
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
    public function create(array $data)
    {
        return $this->partsRepository->create($data);
    }

    public function update(int $id, array $data)
    {
        return $this->partsRepository->update($id, $data);
    }


    public function delete(int $id): bool
    {
        return $this->partsRepository->delete($id);
    }


    public function findById(int $id)
    {
        return $this->partsRepository->findById($id);
    }
}
