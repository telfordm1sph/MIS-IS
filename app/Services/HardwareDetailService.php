<?php

namespace App\Services;

use App\Repositories\HardwareDetailRepository;

class HardwareDetailService
{
    protected HardwareDetailRepository $repository;

    public function __construct(HardwareDetailRepository $repository)
    {
        $this->repository = $repository;
    }
    /**
     * Get hardware full info for API
     */
    public function getHardwareInfo(string $hardwareId): array
    {
        $hardware = $this->repository->getHardwareInfo($hardwareId);

        if (!$hardware) {
            throw new \Exception("Hardware not found with ID: $hardwareId");
        }

        // Transform data for frontend if needed
        $hardwareArray = $hardware->toArray();

        // Optional: flatten nested relationships (parts/software) if needed
        $hardwareArray['parts'] = $hardwareArray['parts'] ?? [];
        $hardwareArray['software'] = $hardwareArray['software'] ?? [];

        return $hardwareArray;
    }

    /**
     * Get parts with inventory and calculate total quantities
     * BUSINESS LOGIC: Aggregate inventory quantities per part
     */
    public function getPartsWithInventory(array $filters = []): array
    {
        $parts = $this->repository->getPartsWithInventory($filters);

        $inventory = [];
        foreach ($parts as $part) {
            // For each inventory record with its condition
            foreach ($part->inventories as $inventoryRecord) {
                $inventory[] = [
                    'part_id' => $part->id,
                    'part_type' => $part->part_type,
                    'brand' => $part->brand,
                    'model' => $part->model,
                    'specifications' => $part->specifications,
                    'condition' => $inventoryRecord->condition,
                    'quantity' => $inventoryRecord->quantity, // Quantity for this specific condition
                ];
            }
        }

        return $inventory;
    }
    /**
     * Get cascading parts options based on filters
     * BUSINESS LOGIC: Return appropriate dropdown options based on current selection
     */
    public function getPartsOptions(array $filters = []): array
    {
        // dd($filters);
        // STEP 1: TYPE ONLY (initial load)
        if (empty($filters)) {
            return [
                'types' => $this->repository->getAvailablePartTypes(),
            ];
        }

        // STEP 2: TYPE → BRAND
        if (!empty($filters['type']) && empty($filters['brand'])) {
            return [
                'brands' => $this->repository->getAvailableBrandsByType($filters['type']),
            ];
        }

        // STEP 3: TYPE → BRAND → MODEL
        if (!empty($filters['type']) && !empty($filters['brand']) && empty($filters['model'])) {
            return [
                'models' => $this->repository->getAvailableModelsByTypeAndBrand(
                    $filters['type'],
                    $filters['brand']
                ),
            ];
        }

        // STEP 4: TYPE → BRAND → MODEL → SPECIFICATIONS
        return [
            'specifications' => $this->repository->getAvailableSpecificationsByFilters($filters),
        ];
    }

    /**
     * Get hardware parts formatted for display
     * BUSINESS LOGIC: Format parts with inventory information
     */
    public function getFormattedHardwareParts(string $hardwareId): array
    {
        $parts = $this->repository->getHardwareParts($hardwareId);

        return $parts->map(fn($part) => [
            'id' => $part->id,
            'serial_number' => $part->serial_number,
            'status' => $part->status,
            'part_info' => [
                'part_type' => $part->part_type,
                'brand' => $part->brand,
                'model' => $part->model,
                'specifications' => $part->specifications,
            ],
            'inventory' => $part->sourceInventory?->only([
                'condition',
                'quantity',
                'location',
                'unit_cost',
                'supplier',
            ]),
        ])->toArray();
    }

    /**
     * Get cascading software options based on filters
     * BUSINESS LOGIC: Return appropriate dropdown options based on current selection
     */
    public function getSoftwareOptions(array $filters = []): array
    {
        // STEP 1: SOFTWARE NAME ONLY
        if (empty($filters)) {
            return [
                'names' => $this->repository->getAvailableSoftwareNames(),
            ];
        }

        // STEP 2: NAME → TYPE
        if (!empty($filters['name']) && empty($filters['type'])) {
            return [
                'types' => $this->repository->getAvailableSoftwareTypesByName($filters['name']),
            ];
        }

        // STEP 3: NAME → TYPE → VERSION
        if (!empty($filters['name']) && !empty($filters['type']) && empty($filters['version'])) {
            return [
                'versions' => $this->repository->getAvailableSoftwareVersionsByNameAndType(
                    $filters['name'],
                    $filters['type']
                ),
            ];
        }

        // STEP 4: NAME → TYPE → VERSION → LICENSE KEYS
        return [
            'licenses' => $this->repository->getAvailableSoftwareLicenseIds($filters),
        ];
    }

    /**
     * Get software licenses with activation info
     * BUSINESS LOGIC: Format licenses with availability calculation
     */
    public function getSoftwareLicenses(array $filters = []): array
    {
        $software = $this->repository->getSoftwareLicensesWithInventory($filters);

        $licenses = [];
        foreach ($software as $sw) {
            foreach ($sw->licenses as $license) {
                $available = $license->max_activations - $license->current_activations;
                if ($available > 0) {
                    // Determine the identifier - license key or account
                    $identifier = $license->license_key;
                    $displayType = 'License Key';

                    if (empty($license->license_key) && !empty($license->account_user)) {
                        $identifier = $license->account_user;
                        $displayType = 'Account';
                    }

                    $licenses[] = [
                        'license_id' => $license->id,
                        'software_inventory_id' => $sw->id,
                        'software_name' => $sw->software_name,
                        'software_type' => $sw->software_type,
                        'version' => $sw->version,
                        'license_key' => $license->license_key,
                        'account_user' => $license->account_user,
                        'account_password' => $license->account_password,
                        'identifier' => $identifier,
                        'display_type' => $displayType,
                        'max_activations' => $license->max_activations,
                        'current_activations' => $license->current_activations,
                        'available_activations' => $available,
                    ];
                }
            }
        }

        return $licenses;
    }

    /**
     * Get hardware software formatted for display
     * BUSINESS LOGIC: Format software with inventory and license information
     */
    public function getFormattedHardwareSoftware(string $hardwareId): array
    {
        $software = $this->repository->getHardwareSoftware($hardwareId);

        return $software->map(fn($s) => [
            'id' => $s->id,
            'installation_date' => $s->installation_date,
            'status' => $s->status,
            'inventory' => $s->softwareInventory?->only([
                'software_name',
                'software_type',
                'version',
                'publisher',
                'license_type',
            ]),
            'license' => $s->softwareLicense?->only([
                'license_key',
                'max_activations',
                'current_activations',
                'account_user',
            ]),
        ])->toArray();
    }

    /**
     * Get software inventory options for dropdown
     * BUSINESS LOGIC: Format software for select dropdown
     */
    public function getSoftwareInventoryOptions(): array
    {
        $software = $this->repository->getAllSoftwareInventoryOptions();

        return $software->map(function ($sw) {
            return [
                'value' => $sw->id,
                'label' => $sw->software_name .
                    ($sw->software_type ? " ({$sw->software_type})" : '') .
                    ($sw->version ? " - v{$sw->version}" : ''),
                'software_name' => $sw->software_name,
                'software_type' => $sw->software_type,
                'version' => $sw->version,
                'publisher' => $sw->publisher,
            ];
        })->toArray();
    }
    /**
     * Get available parts for selection (for REPLACE operation)
     * Returns parts with specific part_type that have available inventory
     * Each part represents a unique serial number with its inventory details
     * 
     * @param array $filters ['part_type' => 'RAM', 'brand' => 'Kingston', etc.]
     * @return array
     */
    public function getAvailablePartsForSelection(array $filters = []): array
    {
        $parts = $this->repository->getAvailablePartsByFilters($filters);

        return $parts->map(function ($part) {
            return [
                'id' => $part->id,
                'part_type' => $part->part_type,
                'brand' => $part->brand,
                'model' => $part->model,
                'specifications' => $part->specifications,
                'serial_number' => $part->serial_number,
                'condition' => $part->inventory_condition ?? 'Unknown',
                'quantity' => $part->inventory_quantity ?? 0,
                'location' => $part->inventory_location ?? 'N/A',
                'unit_cost' => $part->inventory_unit_cost ?? 0,
                'supplier' => $part->inventory_supplier ?? 'N/A',
                'status' => $part->inventory_quantity > 0 ? 'Available' : 'Out of Stock',
                'last_updated' => $part->inventory_updated_at ?? null,
            ];
        })->toArray();
    }

    /**
     * Get all available parts (for ADD operation)
     * Returns all parts across all part types that have available inventory
     * 
     * @param array $filters Optional filters for search/filtering
     * @return array
     */
    public function getAllAvailablePartsForSelection(array $filters = []): array
    {
        $parts = $this->repository->getAllAvailableParts($filters);

        return $parts->map(function ($part) {
            return [
                'id' => $part->id,
                'part_type' => $part->part_type,
                'brand' => $part->brand,
                'model' => $part->model,
                'specifications' => $part->specifications,
                'condition' => $part->inventory_condition ?? 'Unknown',
                'quantity' => $part->inventory_quantity ?? 0,
                'location' => $part->inventory_location ?? 'N/A',
                'unit_cost' => $part->inventory_unit_cost ?? 0,
                'supplier' => $part->inventory_supplier ?? 'N/A',
                'status' => $part->inventory_quantity > 0 ? 'Available' : 'Out of Stock',
                'display_name' => "{$part->brand} {$part->model} - {$part->specifications}",
            ];
        })->toArray();
    }

    /**
     * Get available software for selection (for REPLACE operation)
     * Returns software with specific name/type that have available license activations
     * Each entry represents a unique license with activation availability
     * 
     * @param array $filters ['software_name' => 'Windows', 'software_type' => 'OS', etc.]
     * @return array
     */
    public function getAvailableSoftwareForSelection(array $filters = []): array
    {
        $softwareList = $this->repository->getAvailableSoftwareByFilters($filters);

        $result = [];
        foreach ($softwareList as $software) {
            foreach ($software->licenses as $license) {
                $availableActivations = $license->max_activations - $license->current_activations;

                if ($availableActivations > 0) {
                    // Determine identifier (license key or account)
                    $identifier = $license->license_key ?? $license->account_user ?? 'N/A';
                    $identifierType = !empty($license->license_key) ? 'License Key' : 'Account';

                    $result[] = [
                        'id' => $license->id,
                        'software_inventory_id' => $software->id,
                        'software_name' => $software->software_name,
                        'software_type' => $software->software_type,
                        'version' => $software->version,
                        'publisher' => $software->publisher,
                        'license_type' => $software->license_type,
                        'license_key' => $license->license_key,
                        'account_user' => $license->account_user,
                        'account_password' => $license->account_password,
                        'identifier' => $identifier,
                        'identifier_type' => $identifierType,
                        'max_activations' => $license->max_activations,
                        'current_activations' => $license->current_activations,
                        'available_activations' => $availableActivations,
                        'status' => 'Available',
                        'expiry_date' => $license->expiry_date ?? null,
                    ];
                }
            }
        }

        return $result;
    }

    /**
     * Get all available software (for ADD operation)
     * Returns all software across all types that have available license activations
     * 
     * @param array $filters Optional filters for search/filtering
     * @return array
     */
    public function getAllAvailableSoftwareForSelection(array $filters = []): array
    {
        $softwareList = $this->repository->getAllAvailableSoftware($filters);

        $result = [];
        foreach ($softwareList as $software) {
            foreach ($software->licenses as $license) {
                $availableActivations = $license->max_activations - $license->current_activations;

                if ($availableActivations > 0) {
                    $identifier = $license->license_key ?? $license->account_user ?? 'N/A';
                    $identifierType = !empty($license->license_key) ? 'License Key' : 'Account';

                    $result[] = [
                        'id' => $license->id,
                        'software_inventory_id' => $software->id,
                        'software_name' => $software->software_name,
                        'software_type' => $software->software_type,
                        'version' => $software->version,
                        'publisher' => $software->publisher,
                        'license_type' => $software->license_type,
                        'license_key' => $license->license_key,
                        'account_user' => $license->account_user,
                        'account_password' => $license->account_password,
                        'identifier' => $identifier,
                        'identifier_type' => $identifierType,
                        'max_activations' => $license->max_activations,
                        'current_activations' => $license->current_activations,
                        'available_activations' => $availableActivations,
                        'status' => 'Available',
                        'display_name' => "{$software->software_name} {$software->version} ({$software->software_type})",
                    ];
                }
            }
        }

        return $result;
    }
    // In HardwareDetailService.php

    public function getAllAvailablePartsPaginated(array $filters = [], $page = 1, $pageSize = 5, $sortField = 'brand', $sortOrder = 'asc')
    {
        $query = $this->repository->getAllAvailablePartsQuery($filters);

        // Sorting: join only if sorting by part fields
        if (in_array($sortField, ['brand', 'model', 'part_type'])) {
            $query->join('parts', 'parts.id', '=', 'part_inventory.part_id')
                ->orderBy("parts.{$sortField}", $sortOrder)
                ->select('part_inventory.*'); // keep inventory columns
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $paginator = $query->paginate($pageSize, ['*'], 'page', $page);

        $items = $paginator->getCollection()->map(function ($inventory) {
            $part = $inventory->part;
            return [
                'id' => $part->id,
                'inventory_id' => $inventory->id,
                'part_type' => $part->part_type,
                'brand' => $part->brand,
                'model' => $part->model,
                'specifications' => $part->specifications,
                'condition' => $inventory->condition,
                'quantity' => $inventory->quantity,
                'location' => $inventory->location,
                'unit_cost' => $inventory->unit_cost,
                'supplier' => $inventory->supplier,
                'status' => $inventory->quantity > 0 ? 'Available' : 'Out of Stock',
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }


    public function getAllAvailableSoftwarePaginated(array $filters = [], $page = 1, $pageSize = 5, $sortField = 'software_name', $sortOrder = 'asc')
    {
        $query = $this->repository->getAllAvailableSoftwareQuery($filters);

        // Apply sorting on SoftwareInventory columns
        if (in_array($sortField, ['software_name', 'software_type', 'version'])) {
            $query->join('software_inventory', 'software_inventory.id', '=', 'software_licenses.software_inventory_id')
                ->orderBy("software_inventory.{$sortField}", $sortOrder)
                ->select('software_licenses.*');
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $paginator = $query->paginate($pageSize, ['*'], 'page', $page);

        $items = $paginator->getCollection()->map(function ($license) {
            $software = $license->software; // <- use existing relationship
            $availableActivations = $license->max_activations - $license->current_activations;
            $identifier = $license->license_key ?? $license->account_user ?? 'N/A';
            $identifierType = !empty($license->license_key) ? 'License Key' : 'Account';

            return [
                'id' => $license->id,
                'software_inventory_id' => $software->id,
                'software_name' => $software->software_name,
                'software_type' => $software->software_type,
                'version' => $software->version,
                'publisher' => $software->publisher,
                'license_type' => $software->license_type,
                'identifier' => $identifier,
                'identifier_type' => $identifierType,
                'max_activations' => $license->max_activations,
                'current_activations' => $license->current_activations,
                'available_activations' => $availableActivations,
                'status' => $availableActivations > 0 ? 'Available' : 'Full',
            ];
        });

        return [
            'data' => $items,
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
