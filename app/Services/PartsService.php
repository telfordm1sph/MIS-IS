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
        $parts = [
            'part_type' => $data['part_type'],
            'brand'     => $data['brand'],
            'model'     => $data['model'] ?? null,
            'specifications' => $data['specifications'] ?? null,
        ];

        $partsInventory = [
            'quantity'         => $data['quantity'] ?? 0,
            'condition'        => $data['condition'] ?? null,
            'location'         => $data['location'] ?? null,
            'reorder_level'    => $data['reorder_level'] ?? 0,
            'reorder_quantity' => $data['reorder_quantity'] ?? 0,
            'unit_cost'        => $data['unit_cost'] ?? 0,
            'supplier'         => $data['supplier'] ?? null,
            'remarks'          => $data['remarks'] ?? null,
        ];

        return $this->partsRepository->create($parts, $partsInventory);
    }

    public function update(int $id, array $data)
    {
        $partData = [
            'part_type'      => $data['part_type'] ?? null,
            'brand'          => $data['brand'] ?? null,
            'model'          => $data['model'] ?? null,
            'specifications' => $data['specifications'] ?? null,
        ];

        $inventoryData = [
            'quantity'         => $data['quantity'] ?? null,
            'condition'        => $data['condition'] ?? null,
            'location'         => $data['location'] ?? null,
            'reorder_level'    => $data['reorder_level'] ?? null,
            'reorder_quantity' => $data['reorder_quantity'] ?? null,
            'unit_cost'        => $data['unit_cost'] ?? null,
            'supplier'         => $data['supplier'] ?? null,
            'remarks'          => $data['remarks'] ?? null,
        ];

        return $this->partsRepository->update($id, $partData, $inventoryData);
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
