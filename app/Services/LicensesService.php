<?php

namespace App\Services;

use App\Repositories\LicensesRepository;

class LicensesService
{
    protected LicensesRepository $licensesRepository;

    public function __construct(LicensesRepository $licensesRepository)
    {
        $this->licensesRepository = $licensesRepository;
    }

    public function getLicensesTable(array $filters, $empData = null): array
    {
        // Start query from repository
        $tableQuery = $this->licensesRepository->query()->with('software');

        // ----- Apply search filter -----
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $tableQuery->where(function ($q) use ($search) {
                $q->where('license_key', 'like', "%$search%")
                    ->orWhere('account_user', 'like', "%$search%")
                    ->orWhere('remarks', 'like', "%$search%")
                    ->orWhereHas('software', function ($sq) use ($search) {
                        $sq->where('software_name', 'like', "%$search%")
                            ->orWhere('software_type', 'like', "%$search%")
                            ->orWhere('publisher', 'like', "%$search%");
                    });
            });
        }

        // ----- Sorting -----
        $sortField = $filters['sortField'] ?? 'created_at';
        $sortOrder = $filters['sortOrder'] ?? 'desc';
        $tableQuery->orderBy($sortField, $sortOrder);

        // ----- Pagination -----
        $page = $filters['page'] ?? 1;
        $pageSize = $filters['pageSize'] ?? 10;
        $paginated = $tableQuery->paginate($pageSize, ['*'], 'page', $page);

        $data = $paginated->items();

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
    public function getLicensesLogs(int $licenseId, int $page = 1, int $perPage = 10): array
    {
        // Get the query from the repository
        $logsQuery = $this->licensesRepository->getLogsQuery($licenseId);

        // Total logs
        $total = $logsQuery->count();

        // Apply pagination
        $logs = $logsQuery->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Format logs
        $formattedLogs = $this->licensesRepository->formatLogs($logs);

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
    public function create(array $data, $empData = null)
    {
        // Add created_by from employee data
        if ($empData && isset($empData['emp_id'])) {
            $data['created_by'] = $empData['emp_id'];
            $data['updated_by'] = $empData['emp_id'];
        }

        return $this->licensesRepository->create($data);
    }

    public function update(int $id, array $data, $empData = null)
    {
        // Add updated_by from employee data
        if ($empData && isset($empData['emp_id'])) {
            $data['updated_by'] = $empData['emp_id'];
        }

        return $this->licensesRepository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->licensesRepository->delete($id);
    }

    public function findById(int $id)
    {
        return $this->licensesRepository->findById($id);
    }
}
