<?php

namespace App\Services;

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
        $query = $this->partsRepository->query();

        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('part', function ($q2) use ($search) {
                    $q2->where('part_type', 'like', "%$search%")
                        ->orWhere('brand', 'like', "%$search%")
                        ->orWhere('model', 'like', "%$search%")
                        ->orWhere('specifications', 'like', "%$search%");
                })->orWhere('location', 'like', "%$search%");
            });
        }

        // Sorting
        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        // Pagination
        $page = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $query->paginate($pageSize, ['*'], 'page', $page);

        return [
            'data' => $paginated->items(),
            'pagination' => [
                'current' => $paginated->currentPage(),
                'lastPage' => $paginated->lastPage(),
                'total' => $paginated->total(),
                'perPage' => $paginated->perPage(),
            ],
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
