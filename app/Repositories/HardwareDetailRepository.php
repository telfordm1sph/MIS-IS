<?php

namespace App\Repositories;

use App\Models\Hardware;
use App\Models\HardwarePart;
use App\Models\HardwareSoftware;
use App\Models\Part;
use App\Models\PartInventory;
use App\Models\SoftwareInventory;
use App\Models\SoftwareLicense;
use Illuminate\Support\Facades\DB;

class HardwareDetailRepository
{
    /**
     * Get full hardware info using Eloquent relationships
     * Includes parts, software, issuedToUser, installedByUser
     */
    public function getHardwareInfo(string $hardwareId)
    {
        return Hardware::with([
            'issuedToUser:EMPLOYID,EMPNAME',
            'installedByUser:EMPLOYID,EMPNAME',
            'parts.sourceInventory',        // Include inventory details for each part
            'software.softwareInventory',   // Include software info
            'software.softwareLicense',     // Include license info
        ])
            ->where('hostname', $hardwareId)
            ->first();
    }
    public function getHardwareInfoById(int $hardwareId)
    {
        return Hardware::with([
            'issuedToUser:EMPLOYID,EMPNAME',
            'installedByUser:EMPLOYID,EMPNAME',
            'parts.sourceInventory',        // Include inventory details for each part
            'software.softwareInventory',   // Include software info
            'software.softwareLicense',     // Include license info
        ])
            ->where('id', $hardwareId)
            ->first();
    }
    /**
     * Get parts with inventory (filtered)
     * DB OPERATION: Query parts with inventory relationships
     */
    public function getPartsWithInventory(array $filters = [])
    {
        $query = Part::query()
            ->with(['inventories' => function ($q) {
                $q->usableGrouped();
            }]);

        if (!empty($filters['type'])) {
            $query->where('part_type', $filters['type']);
        }

        if (!empty($filters['brand'])) {
            $query->where('brand', $filters['brand']);
        }

        if (!empty($filters['model'])) {
            $query->where('model', $filters['model']);
        }

        return $query->get();
    }

    /**
     * Get distinct part types with available inventory
     * DB OPERATION: Distinct query with inventory filter
     */
    public function getAvailablePartTypes()
    {
        return Part::query()
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective');
            })
            ->select('part_type')
            ->distinct()
            ->orderBy('part_type')
            ->pluck('part_type');
    }

    /**
     * Get distinct brands for a part type with available inventory
     * DB OPERATION: Distinct query with filters
     */
    public function getAvailableBrandsByType(string $partType)
    {
        return Part::query()
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective');
            })
            ->where('part_type', $partType)
            ->select('brand')
            ->distinct()
            ->orderBy('brand')
            ->pluck('brand');
    }

    /**
     * Get distinct models for a part type and brand with available inventory
     * DB OPERATION: Distinct query with filters
     */
    public function getAvailableModelsByTypeAndBrand(string $partType, string $brand)
    {
        return Part::query()
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective');
            })
            ->where('part_type', $partType)
            ->where('brand', $brand)
            ->select('model')
            ->distinct()
            ->orderBy('model')
            ->pluck('model');
    }

    /**
     * Get distinct specifications for filtered parts with available inventory
     * DB OPERATION: Distinct query with filters
     */
    public function getAvailableSpecificationsByFilters(array $filters)
    {
        $query = Part::query()
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective');
            });

        if (!empty($filters['type'])) {
            $query->where('part_type', $filters['type']);
        }

        if (!empty($filters['brand'])) {
            $query->where('brand', $filters['brand']);
        }

        if (!empty($filters['model'])) {
            $query->where('model', $filters['model']);
        }

        return $query->select('specifications')
            ->distinct()
            ->orderBy('specifications')
            ->pluck('specifications');
    }

    /**
     * Get hardware parts with relationships
     * DB OPERATION: Query hardware parts with eager loading
     */
    public function getHardwareParts(string $hardwareId)
    {
        return HardwarePart::where('hardware_id', $hardwareId)
            ->select(
                'id',
                'serial_number',
                'status',
                'source_inventory_id',
                'part_type',
                'brand',
                'model',
                'specifications'
            )
            ->with([
                'sourceInventory:id,part_id,condition,quantity,location,unit_cost,supplier',
            ])
            ->get();
    }

    /**
     * Get available software names with licenses
     * DB OPERATION: Distinct query with license availability filter
     */
    public function getAvailableSoftwareNames()
    {
        return SoftwareInventory::query()
            ->whereHas('licenses', function ($q) {
                $q->whereRaw('current_activations < max_activations');
            })
            ->select('software_name')
            ->distinct()
            ->orderBy('software_name')
            ->pluck('software_name');
    }

    /**
     * Get software types for a given name with available licenses
     * DB OPERATION: Distinct query with filters
     */
    public function getAvailableSoftwareTypesByName(string $softwareName)
    {
        return SoftwareInventory::query()
            ->whereHas('licenses', function ($q) {
                $q->whereRaw('current_activations < max_activations');
            })
            ->where('software_name', $softwareName)
            ->select('software_type')
            ->distinct()
            ->orderBy('software_type')
            ->pluck('software_type');
    }

    /**
     * Get software versions for a given name and type with available licenses
     * DB OPERATION: Distinct query with filters
     */
    public function getAvailableSoftwareVersionsByNameAndType(string $softwareName, string $softwareType)
    {
        return SoftwareInventory::query()
            ->whereHas('licenses', function ($q) {
                $q->whereRaw('current_activations < max_activations');
            })
            ->where('software_name', $softwareName)
            ->where('software_type', $softwareType)
            ->select('version')
            ->distinct()
            ->orderBy('version')
            ->pluck('version');
    }

    /**
     * Get software inventory IDs with available licenses (filtered)
     * DB OPERATION: Query with filters
     */
    public function getAvailableSoftwareLicenseIds(array $filters)
    {
        $query = SoftwareInventory::query()
            ->whereHas('licenses', function ($q) {
                $q->whereRaw('current_activations < max_activations');
            });

        if (!empty($filters['name'])) {
            $query->where('software_name', $filters['name']);
        }

        if (!empty($filters['type'])) {
            $query->where('software_type', $filters['type']);
        }

        if (!empty($filters['version'])) {
            $query->where('version', $filters['version']);
        }

        return $query->select('id')
            ->distinct()
            ->get()
            ->pluck('id');
    }

    /**
     * Get software licenses with inventory details (filtered)
     * DB OPERATION: Query with relationships and filters
     */
    public function getSoftwareLicensesWithInventory(array $filters = [])
    {
        $query = SoftwareInventory::query()
            ->with(['licenses' => function ($q) {
                $q->whereRaw('current_activations < max_activations');
            }]);

        if (!empty($filters['name'])) {
            $query->where('software_name', $filters['name']);
        }

        if (!empty($filters['type'])) {
            $query->where('software_type', $filters['type']);
        }

        if (!empty($filters['version'])) {
            $query->where('version', $filters['version']);
        }

        return $query->get();
    }

    /**
     * Get hardware software with relationships
     * DB OPERATION: Query hardware software with eager loading
     */
    public function getHardwareSoftware(string $hardwareId)
    {
        return HardwareSoftware::where('hardware_id', $hardwareId)
            ->select(
                'id',
                'hardware_id',
                'software_inventory_id',
                'software_license_id',
                'installation_date',
                'status'
            )
            ->with([
                'softwareInventory:id,software_name,software_type,version,publisher,license_type',
                'softwareLicense:id,license_key,max_activations,current_activations,account_user',
            ])
            ->get();
    }

    /**
     * Get all software inventory for dropdown options
     * DB OPERATION: Query all software inventory
     */
    public function getAllSoftwareInventoryOptions()
    {
        return SoftwareInventory::query()
            ->select('id', 'software_name', 'software_type', 'version', 'publisher')
            ->orderBy('software_name')
            ->get();
    }
    // ============================================================
// NEW QUERIES FOR TABLE-BASED SELECTION (ELOQUENT)
// ============================================================

    /**
     * Get available parts by filters (for REPLACE - filtered by part_type)
     * Uses Eloquent relationships to join with part_inventory
     * Only returns parts where quantity > 0 and not currently installed
     * 
     * @param array $filters
     * @return \Illuminate\Support\Collection
     */
    public function getAvailablePartsByFilters(array $filters = [])
    {
        $query = Part::query()
            ->with(['inventories' => function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective')
                    ->select('part_id', 'condition', 'quantity', 'location', 'unit_cost', 'supplier', 'updated_at');
            }])
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective');
            });

        // Apply filters
        if (!empty($filters['part_type'])) {
            $query->where('part_type', $filters['part_type']);
        }

        if (!empty($filters['brand'])) {
            $query->where('brand', $filters['brand']);
        }

        if (!empty($filters['model'])) {
            $query->where('model', $filters['model']);
        }

        if (!empty($filters['condition'])) {
            $query->whereHas('inventories', function ($q) use ($filters) {
                $q->where('condition', $filters['condition']);
            });
        }

        return $query->orderBy('brand')
            ->orderBy('model')
            ->get()
            ->flatMap(function ($part) {
                // Return one row per inventory record (different conditions/locations)
                return $part->inventories->map(function ($inventory) use ($part) {
                    return (object) [
                        'id' => $part->id,
                        'inventory_id' => $inventory->id,
                        'part_type' => $part->part_type,
                        'brand' => $part->brand,
                        'model' => $part->model,
                        'specifications' => $part->specifications,
                        'inventory_condition' => $inventory->condition,
                        'inventory_quantity' => $inventory->quantity,
                        'inventory_location' => $inventory->location,
                        'inventory_unit_cost' => $inventory->unit_cost,
                        'inventory_supplier' => $inventory->supplier,
                        'inventory_updated_at' => $inventory->updated_at,
                    ];
                });
            });
    }

    /**
     * Get all available parts (for ADD - all part types)
     * Returns all parts with available inventory across all types
     * 
     * @param array $filters
     * @return \Illuminate\Support\Collection
     */
    public function getAllAvailableParts(array $filters = [])
    {
        $query = Part::query()
            ->with(['inventories' => function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective')
                    ->select('part_id', 'condition', 'quantity', 'location', 'unit_cost', 'supplier');
            }])
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0)
                    ->where('condition', '!=', 'Defective');
            });

        // Optional filters
        if (!empty($filters['part_type'])) {
            $query->where('part_type', $filters['part_type']);
        }

        if (!empty($filters['brand'])) {
            $query->where('brand', $filters['brand']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('specifications', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('part_type')
            ->orderBy('brand')
            ->orderBy('model')
            ->get()
            ->flatMap(function ($part) {
                return $part->inventories->map(function ($inventory) use ($part) {
                    return (object) [
                        'id' => $part->id,
                        'inventory_id' => $inventory->id,
                        'part_type' => $part->part_type,
                        'brand' => $part->brand,
                        'model' => $part->model,
                        'specifications' => $part->specifications,
                        'inventory_condition' => $inventory->condition,
                        'inventory_quantity' => $inventory->quantity,
                        'inventory_location' => $inventory->location,
                        'inventory_unit_cost' => $inventory->unit_cost,
                        'inventory_supplier' => $inventory->supplier,
                    ];
                });
            });
    }

    /**
     * Get available software by filters (for REPLACE - filtered by name/type)
     * Uses Eloquent relationships with software_licenses
     * Only returns software where available_activations > 0
     * 
     * @param array $filters
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAvailableSoftwareByFilters(array $filters = [])
    {
        $query = SoftwareInventory::query()
            ->with(['licenses' => function ($q) {
                $q->whereRaw('current_activations < max_activations')
                    ->orderBy('subscription_end', 'desc');
            }])
            ->whereHas('licenses', function ($q) {
                $q->whereRaw('current_activations < max_activations');
            });

        // Apply filters
        if (!empty($filters['software_name'])) {
            $query->where('software_name', $filters['software_name']);
        }

        if (!empty($filters['software_type'])) {
            $query->where('software_type', $filters['software_type']);
        }

        if (!empty($filters['version'])) {
            $query->where('version', $filters['version']);
        }

        return $query->orderBy('software_name')
            ->orderBy('version', 'desc')
            ->get();
    }

    /**
     * Get all available software (for ADD - all types)
     * Returns all software with available license activations
     * 
     * @param array $filters
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllAvailableSoftware(array $filters = [])
    {
        $query = SoftwareInventory::query()
            ->with(['licenses' => function ($q) {
                $q->whereRaw('current_activations < max_activations')
                    ->orderBy('subscription_end', 'desc');
            }])
            ->whereHas('licenses', function ($q) {
                $q->whereRaw('current_activations < max_activations');
            });

        // Optional filters
        if (!empty($filters['software_name'])) {
            $query->where('software_name', $filters['software_name']);
        }

        if (!empty($filters['software_type'])) {
            $query->where('software_type', $filters['software_type']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('software_name', 'like', "%{$search}%")
                    ->orWhere('software_type', 'like', "%{$search}%")
                    ->orWhere('version', 'like', "%{$search}%")
                    ->orWhere('publisher', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('software_name')
            ->orderBy('software_type')
            ->orderBy('version', 'desc')
            ->get();
    }



    /**
     * Returns PartInventory query with related Part for available parts
     */
    public function getAllAvailablePartsQuery(array $filters = [])
    {
        $query = PartInventory::with(['part'])
            ->where('quantity', '>', 0)
            ->where('condition', '!=', 'Defective');

        // Optional filters applied on related Part
        if (!empty($filters['part_type'])) {
            $query->whereHas('part', fn($q) => $q->where('part_type', $filters['part_type']));
        }

        if (!empty($filters['selected_type'])) {
            $query->whereHas('part', fn($q) => $q->where('part_type', $filters['selected_type']));
        }
        if (!empty($filters['brand'])) {
            $query->whereHas('part', fn($q) => $q->where('brand', $filters['brand']));
        }
        if (!empty($filters['model'])) {
            $query->whereHas('part', fn($q) => $q->where('model', $filters['model']));
        }

        // Search across brand, model, specifications
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas(
                'part',
                fn($q) =>
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('specifications', 'like', "%{$search}%")
            );
        }

        return $query;
    }


    /**
     * Returns SoftwareLicense query with related SoftwareInventory for available software
     */
    public function getAllAvailableSoftwareQuery(array $filters = [])
    {
        $query = SoftwareLicense::with(['software'])
            ->whereRaw('current_activations < max_activations');

        // Optional filters applied on related Software
        if (!empty($filters['software_name'])) {
            $query->whereHas('software', fn($q) => $q->where('software_name', $filters['software_name']));
        }
        if (!empty($filters['selected_type'])) {
            $query->whereHas('software', fn($q) => $q->where('software_name', $filters['selected_type']));
        }
        if (!empty($filters['software_type'])) {
            $query->whereHas('software', fn($q) => $q->where('software_type', $filters['software_type']));
        }

        if (!empty($filters['version'])) {
            $query->whereHas('software', fn($q) => $q->where('version', $filters['version']));
        }

        // Search across software_name, software_type, version
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas(
                'software',
                fn($q) =>
                $q->where('software_name', 'like', "%{$search}%")
                    ->orWhere('software_type', 'like', "%{$search}%")
                    ->orWhere('version', 'like', "%{$search}%")
            );
        }

        return $query;
    }

    /**
     * Get hardware part by ID
     */
    public function getHardwarePartById(int $id): ?HardwarePart
    {
        return HardwarePart::find($id);
    }

    /**
     * Get hardware software by ID
     */
    public function getHardwareSoftwareById(int $id): ?HardwareSoftware
    {
        return HardwareSoftware::with(['softwareInventory', 'softwareLicense'])->find($id);
    }
}
