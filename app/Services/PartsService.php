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
        $query = $this->partsRepository->query()
            ->with('part'); // eager load the related part

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
                })->orWhere('condition', 'like', "%$search%")
                    ->orWhere('location', 'like', "%$search%");
            });
        }

        // Sorting
        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';

        // Handle sorting by related Part fields
        $relatedFields = ['part_type', 'brand', 'model', 'specifications'];
        if (in_array($sortField, $relatedFields)) {
            $query->join('parts', 'parts.id', '=', 'part_inventory.part_id')
                ->orderBy("parts.$sortField", $sortOrder)
                ->select('part_inventory.*'); // prevent selecting extra joined columns
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

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

    public function getPartsLogs(int $partsId, int $page = 1, int $perPage = 10): array
    {
        // Get the query from the repository
        $logsQuery = $this->partsRepository->getLogsQuery($partsId);

        // Total logs
        $total = $logsQuery->count();

        // Apply pagination
        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Format logs
        $formattedLogs = $this->partsRepository->formatLogs($logs);

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
