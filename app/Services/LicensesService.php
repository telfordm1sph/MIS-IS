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
        $licenseData = [
            'software_inventory_id' => $data['software_inventory_id'],
            'license_key'           => $data['license_key'] ?? null,
            'account_user'          => $data['account_user'] ?? null,
            'account_password'      => $data['account_password'] ?? null,
            'max_activations'       => $data['max_activations'] ?? null,
            'current_activations'   => $data['current_activations'] ?? 0,
            'subscription_start'    => $data['subscription_start'] ?? null,
            'subscription_end'      => $data['subscription_end'] ?? null,
            'renewal_reminder_days' => $data['renewal_reminder_days'] ?? null,
            'cost_per_license'      => $data['cost_per_license'] ?? null,
            'remarks'               => $data['remarks'] ?? null,
            'created_by'            => $empData['emp_id'] ?? null,
            'updated_by'            => $empData['emp_id'] ?? null,
        ];

        $licenses = $this->licensesRepository->create($licenseData);
        return $licenses;
    }

    public function update(int $id, array $data, $empData = null)
    {
        $licenseData = [
            'software_inventory_id' => $data['software_inventory_id'],
            'license_key'           => $data['license_key'] ?? null,
            'account_user'          => $data['account_user'] ?? null,
            'account_password'      => $data['account_password'] ?? null,
            'max_activations'       => $data['max_activations'] ?? null,
            'current_activations'   => $data['current_activations'] ?? null,
            'subscription_start'    => $data['subscription_start'] ?? null,
            'subscription_end'      => $data['subscription_end'] ?? null,
            'renewal_reminder_days' => $data['renewal_reminder_days'] ?? null,
            'cost_per_license'      => $data['cost_per_license'] ?? null,
            'remarks'               => $data['remarks'] ?? null,
            'updated_by'            => $empData['emp_id'] ?? null,
        ];

        $licenses = $this->licensesRepository->update($id, $licenseData);
        return $licenses;
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
