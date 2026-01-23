<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HardwarePart;
use App\Models\HardwareSoftware;
use App\Models\Part;
use App\Models\PartInventory;
use App\Models\SoftwareInventory;
use App\Models\SoftwareLicense;
use Illuminate\Support\Facades\DB;

class HardwareDetailController extends Controller
{
    /* ===============================
     *  DECODE BASE64 FILTERS
     * =============================== */
    protected function decodeFilters(?string $encoded): array
    {
        if (!$encoded) {
            return [];
        }

        $decoded = base64_decode($encoded);
        return $decoded ? json_decode($decoded, true) : [];
    }

    /* ===============================
     *  GET INVENTORY WITH QUANTITIES
     * =============================== */
    public function partsInventory(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

        $query = Part::query()
            ->with(['inventories' => function ($q) {
                $q->where('quantity', '>', 0);
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

        $parts = $query->get();

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

        return response()->json($inventory);
    }

    /* ===============================
     *  PARTS OPTIONS (TYPE → BRAND → MODEL → SPEC)
     *  Only show options where inventory quantity > 0
     * =============================== */
    public function partsOptions(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

        // Base query using Eloquent relationships
        $query = Part::query()
            ->whereHas('inventories', function ($q) {
                $q->where('quantity', '>', 0);
            });

        // Filter by type
        if (!empty($filters['type'])) {
            $query->where('part_type', $filters['type']);
        }

        // Filter by brand
        if (!empty($filters['brand'])) {
            $query->where('brand', $filters['brand']);
        }

        // Filter by model
        if (!empty($filters['model'])) {
            $query->where('model', $filters['model']);
        }

        // STEP 1: TYPE ONLY (initial load)
        if (empty($filters)) {
            return response()->json([
                'types' => Part::query()
                    ->whereHas('inventories', function ($q) {
                        $q->where('quantity', '>', 0);
                    })
                    ->select('part_type')
                    ->distinct()
                    ->orderBy('part_type')
                    ->pluck('part_type'),
            ]);
        }

        // STEP 2: TYPE → BRAND
        if (!empty($filters['type']) && empty($filters['brand'])) {
            return response()->json([
                'brands' => $query
                    ->select('brand')
                    ->distinct()
                    ->orderBy('brand')
                    ->pluck('brand'),
            ]);
        }

        // STEP 3: TYPE → BRAND → MODEL
        if (!empty($filters['type']) && !empty($filters['brand']) && empty($filters['model'])) {
            return response()->json([
                'models' => $query
                    ->select('model')
                    ->distinct()
                    ->orderBy('model')
                    ->pluck('model'),
            ]);
        }

        // STEP 4: TYPE → BRAND → MODEL → SPECIFICATIONS
        return response()->json([
            'specifications' => $query
                ->select('specifications')
                ->distinct()
                ->orderBy('specifications')
                ->pluck('specifications'),
        ]);
    }

    /* ===============================
     *  HARDWARE PARTS LIST
     * =============================== */
    public function parts($hardwareId)
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
            ->get()
            ->map(fn($part) => [
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
            ]);
    }

    /* ===============================
     *  SOFTWARE OPTIONS (NAME → TYPE → VERSION → LICENSE)
     *  Only show software with available license activations
     * =============================== */
    public function softwareOptions(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

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

        // STEP 1: SOFTWARE NAME ONLY
        if (empty($filters)) {
            return response()->json([
                'names' => SoftwareInventory::query()
                    ->whereHas('licenses', function ($q) {
                        $q->whereRaw('current_activations < max_activations');
                    })
                    ->select('software_name')
                    ->distinct()
                    ->orderBy('software_name')
                    ->pluck('software_name'),
            ]);
        }

        // STEP 2: NAME → TYPE
        if (!empty($filters['name']) && empty($filters['type'])) {
            return response()->json([
                'types' => $query
                    ->select('software_type')
                    ->distinct()
                    ->orderBy('software_type')
                    ->pluck('software_type'),
            ]);
        }

        // STEP 3: NAME → TYPE → VERSION
        if (!empty($filters['name']) && !empty($filters['type']) && empty($filters['version'])) {
            return response()->json([
                'versions' => $query
                    ->select('version')
                    ->distinct()
                    ->orderBy('version')
                    ->pluck('version'),
            ]);
        }

        // STEP 4: NAME → TYPE → VERSION → LICENSE KEYS
        return response()->json([
            'licenses' => $query
                ->select('id')
                ->distinct()
                ->get()
                ->pluck('id'),
        ]);
    }

    /* ===============================
     *  GET SOFTWARE LICENSES WITH ACTIVATION INFO
     * =============================== */
    public function softwareLicenses(?string $filters = null)
    {
        $filters = $this->decodeFilters($filters);

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

        $software = $query->get();

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

        return response()->json($licenses);
    }

    /* ===============================
     *  SOFTWARE LIST
     * =============================== */
    public function software($hardwareId)
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
            ->get()
            ->map(fn($s) => [
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
            ]);
    }
}
