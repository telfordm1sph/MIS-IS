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
     * Get parts with inventory and calculate total quantities
     * BUSINESS LOGIC: Aggregate inventory quantities per part
     */
    public function getPartsWithInventory(array $filters = []): array
    {
        $parts = $this->repository->getPartsWithInventory($filters);

        $inventory = [];
        foreach ($parts as $part) {
            $totalQuantity = $part->inventories->sum('quantity');
            if ($totalQuantity > 0) {
                $inventory[] = [
                    'part_id' => $part->id,
                    'part_type' => $part->part_type,
                    'brand' => $part->brand,
                    'model' => $part->model,
                    'specifications' => $part->specifications,
                    'available_quantity' => $totalQuantity,
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
}
