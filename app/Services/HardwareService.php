<?php

namespace App\Services;

use App\Constants\Status;
use App\Repositories\HardwareRepository;

class HardwareService
{
    protected HardwareRepository $hardwareRepository;

    public function __construct(HardwareRepository $hardwareRepository)
    {
        $this->hardwareRepository = $hardwareRepository;
    }

    public function getHardwareTable(array $filters): array
    {
        // Start query from repository
        $tableQuery = $this->hardwareRepository->query();
        $countQuery = $this->hardwareRepository->query();

        // ----- Apply status filter -----
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $tableQuery->where('status', $filters['status']);
        }

        // ----- Apply search filter -----
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $tableQuery->where(function ($q) use ($search) {
                $q->where('hostname', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
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

        // ----- Format table data with status labels -----
        $data = collect($paginated->items())->map(function ($hardware) {
            $hardwareArray = is_array($hardware) ? $hardware : $hardware->toArray();

            // Map parts
            $hardwareArray['parts'] = collect($hardwareArray['parts'])->map(fn($p) => (array) $p);

            // Map software with inventory and license details
            $hardwareArray['software'] = collect($hardwareArray['software'])->map(function ($s) {
                $s = (array) $s;

                $s['inventory'] = isset($s['software_inventory'])
                    ? (array) $s['software_inventory']
                    : null;

                $s['license'] = isset($s['software_license'])
                    ? (array) $s['software_license']
                    : null;

                unset($s['software_inventory'], $s['software_license']);

                return $s;
            });


            return array_merge($hardwareArray, [
                'status_label' => Status::getLabel($hardwareArray['status']),
                'status_color' => Status::getColor($hardwareArray['status']),
            ]);
        });



        // ----- Status counts -----
        $countQuery->getQuery()->orders = []; // remove any previous orders
        $statusCounts = $this->hardwareRepository->getHardwareStatusCounts($countQuery);

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
            'statusCounts' => $statusCounts,
            'filters'      => $filters,
        ];
    }
}
