<?php

namespace App\Services;

use App\Constants\Status;
use App\Http\Resources\HardwareResource;
use App\Repositories\HardwareRepository;
use App\Models\Hardware;
use App\Models\User;
use App\Repositories\ReferenceRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HardwareService
{
    protected HardwareRepository $hardwareRepository;
    protected UserRepository $userRepository;
    protected ReferenceRepository $referenceRepository;

    public function __construct(HardwareRepository $hardwareRepository, UserRepository $userRepository, ReferenceRepository $referenceRepository)
    {
        $this->hardwareRepository = $hardwareRepository;
        $this->userRepository = $userRepository;
        $this->referenceRepository = $referenceRepository;
    }

    /**
     * Get hardware table data with filters, pagination, and counts
     * BUSINESS LOGIC: Orchestrate data retrieval and formatting
     */
    public function getHardwareTable(array $filters): array
    {
        $tableQuery = $this->hardwareRepository->query();
        $tableQuery = $this->applyFilters($tableQuery, $filters);
        $tableQuery->orderBy($filters['sortField'] ?? 'created_at', $filters['sortOrder'] ?? 'desc');

        $paginated = $this->hardwareRepository->paginate(
            $tableQuery,
            $filters['pageSize'] ?? 10,
            $filters['page'] ?? 1
        );

        $items = collect($paginated->items());

        // Resolve reference names and attach to model instances
        $this->attachReferenceNames($items);

        return [
            'data'           => HardwareResource::collection($items)->resolve(),
            'pagination'     => [
                'current'     => $paginated->currentPage(),
                'currentPage' => $paginated->currentPage(),
                'lastPage'    => $paginated->lastPage(),
                'total'       => $paginated->total(),
                'perPage'     => $paginated->perPage(),
                'pageSize'    => $paginated->perPage(),
            ],
            'categoryCounts' => Cache::remember(
                'hardware.category_counts',
                60,
                fn() =>
                $this->hardwareRepository->getCategoryCounts()
            ),
            'filters'        => $filters,
        ];
    }

    protected function attachReferenceNames(Collection $items): void
    {
        $departmentIds = $items->pluck('department')->filter()->unique()->toArray();
        $locationIds   = $items->pluck('location')->filter()->unique()->toArray();
        $stationIds    = $items->pluck('station')->filter()->unique()->toArray();
        $prodlineIds   = $items->pluck('prodline')->filter()->unique()->toArray();
        $allUserIds    = $items->flatMap(fn($h) => $h->users->pluck('user_id'))->unique()->toArray();

        $departments = $this->referenceRepository->getDepartmentsByIds($departmentIds);
        $locations   = $this->referenceRepository->getLocationsByIds($locationIds);
        $stations    = $this->referenceRepository->getStationsByIds($stationIds);
        $prodlines   = $this->referenceRepository->getProdlinesByIds($prodlineIds);
        $users       = $this->userRepository->getUsersByIds($allUserIds);

        $items->each(function ($hardware) use ($departments, $locations, $stations, $prodlines, $users) {
            $hardware->department_name = optional($departments[$hardware->department] ?? null)->DEPTNAME;
            $hardware->location_name   = optional($locations[$hardware->location] ?? null)->location_name;
            $hardware->station_name    = optional($stations[$hardware->station] ?? null)->station_name;
            $hardware->prodline_name   = optional($prodlines[$hardware->prodline] ?? null)->pl_name;

            // Attach resolved user details onto each HardwareUsers pivot record
            $hardware->users->each(function ($hu) use ($users) {
                $user = $users[$hu->user_id] ?? null;
                if (!$user) return;

                $hu->resolved_name = trim(implode(' ', array_filter([
                    $user['FIRSTNAME'] ?? null,
                    $user['MIDDLE_INITIAL'] ?? null,
                    $user['LASTNAME'] ?? null,
                ])));

                $hu->resolved_initials = strtoupper(
                    ($user['FIRSTNAME'][0] ?? '') .
                        ($user['MIDDLE_INITIAL'][0] ?? '') .
                        ($user['LASTNAME'][0] ?? '')
                );
            });
        });
    }

    /**
     * Get hardware logs with pagination
     * BUSINESS LOGIC: Orchestrate log retrieval and formatting
     */
    public function getHardwareLogs(int $hardwareId, int $page = 1, int $perPage = 10): array
    {
        // REPO: Get logs query
        $logsQuery = $this->hardwareRepository->getLogsQuery($hardwareId);

        // REPO: Get total count
        $total = $this->hardwareRepository->countQuery($logsQuery);

        // BUSINESS LOGIC: Calculate pagination
        $offset = ($page - 1) * $perPage;
        $lastPage = ceil($total / $perPage);

        // REPO: Get paginated logs
        $logs = $this->hardwareRepository->getPaginatedLogs($logsQuery, $offset, $perPage);

        // REPO: Format logs
        $formattedLogs = $this->hardwareRepository->formatLogs($logs);

        return [
            'data' => $formattedLogs,
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'has_more' => $page < $lastPage,
        ];
    }

    /**
     * Delete hardware with inventory management
     * BUSINESS LOGIC: Orchestrate deletion with inventory returns
     * ENHANCED: Now passes context to inventory and license operations
     */
    public function deleteHardware(int $hardwareId, int $employeeId): void
    {
        DB::transaction(function () use ($hardwareId, $employeeId) {
            // REPO: Find hardware with relationships
            $hardware = $this->hardwareRepository->findWithRelations($hardwareId);

            if (!$hardware) {
                throw new \Exception("Hardware not found");
            }

            // BUSINESS LOGIC: Return parts to inventory WITH CONTEXT
            foreach ($hardware->parts as $part) {
                $this->returnPartToInventory($part, 'Working', $hardware, $employeeId);
            }

            // BUSINESS LOGIC: Release software licenses WITH CONTEXT
            foreach ($hardware->software as $software) {
                $this->releaseSoftwareLicense($software, $hardware, $employeeId);
            }

            // REPO: Delete related records and hardware
            $this->hardwareRepository->deleteHardwareWithRelations($hardware);

            Log::info("Hardware deleted", [
                'hardware_id' => $hardwareId,
                'hostname' => $hardware->hostname,
                'deleted_by' => $employeeId,
            ]);
        });
    }

    /**
     * Apply filters to query
     * BUSINESS LOGIC: Filter application logic
     */
    protected function applyFilters($query, array $filters)
    {
        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // Category filter
        if (!empty($filters['category'])) {
            $category = $filters['category'];

            // Check if it's a status-based filter
            if (in_array($category, ['New', 'Inactive', 'Defective'])) {
                $statusValue = Status::getValue($category);
                if ($statusValue !== null) {
                    $query->where('status', $statusValue);
                }
            } else {
                $query->where('category', $category);
            }
        }

        // SubCategory filter
        if (!empty($filters['subCategory'])) {
            $query->where('category', $filters['subCategory']);
        }

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('hostname', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        return $query;
    }


    /**
     * Return part to inventory when hardware is deleted
     * BUSINESS LOGIC: Inventory management logic
     * ENHANCED: Now passes context to inventory increment
     */
    protected function returnPartToInventory($hardwarePart, string $condition, Hardware $hardware, int $employeeId): void
    {
        // REPO: Find the part
        $part = $this->hardwareRepository->findPart(
            $hardwarePart->part_type,
            $hardwarePart->brand,
            $hardwarePart->model,
            $hardwarePart->specifications
        );

        if (!$part) {
            Log::warning("Part not found when returning to inventory", [
                'hardware_part_id' => $hardwarePart->id,
                'part_type' => $hardwarePart->part_type,
            ]);
            return;
        }

        // REPO: Find or create inventory record
        $inventory = $this->hardwareRepository->findOrCreatePartInventory($part->id, $condition);

        // Build context reason
        $reason = "Returned from deleted hardware: {$hardware->hostname} ({$hardware->category}). Part was in '{$condition}' condition.";

        // REPO: Increment inventory WITH CONTEXT
        $this->hardwareRepository->incrementInventory($inventory->id, 1, $reason, $employeeId);

        Log::info("Returned part to inventory", [
            'hardware_part_id' => $hardwarePart->id,
            'inventory_id' => $inventory->id,
            'hardware' => $hardware->hostname,
            'condition' => $condition,
        ]);
    }

    /**
     * Release software license when hardware is deleted
     * BUSINESS LOGIC: License management logic
     * ENHANCED: Now passes context to license decrement
     */
    protected function releaseSoftwareLicense($hardwareSoftware, Hardware $hardware, int $employeeId): void
    {
        if ($hardwareSoftware->software_license_id) {
            // REPO: Find license
            $license = $this->hardwareRepository->findSoftwareLicense($hardwareSoftware->software_license_id);

            if ($license && $license->current_activations > 0) {
                // Load software inventory for context
                $hardwareSoftware->loadMissing('softwareInventory');

                $softwareName = $hardwareSoftware->softwareInventory
                    ? $hardwareSoftware->softwareInventory->software_name
                    : 'Unknown Software';

                // Build context reason
                $reason = "Released from deleted hardware: {$hardware->hostname}. Software: {$softwareName}";

                // REPO: Decrement activation WITH CONTEXT
                $this->hardwareRepository->decrementLicenseActivation($license->id, 1, $reason, $employeeId);

                Log::info("Released software license", [
                    'hardware_software_id' => $hardwareSoftware->id,
                    'license_id' => $license->id,
                    'hardware' => $hardware->hostname,
                    'software' => $softwareName,
                ]);
            }
        }
    }

    /**
     * Get user name helper
     * BUSINESS LOGIC: User name formatting
     */
    protected function getUserName($userId, $userObject): string
    {
        if (is_numeric($userId) && $userObject) {
            return $userObject->EMPNAME ?? $userId;
        }

        return $userId ?? '';
    }
}
