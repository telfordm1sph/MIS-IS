<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HardwarePart;
use App\Models\HardwareSoftware;

class HardwareDetailController extends Controller
{
    public function parts($hardwareId)
    {
        // dd($hardwareId);
        return HardwarePart::where('hardware_id', $hardwareId)
            ->select(
                'id',
                'part_type',
                'brand',
                'model',
                'specifications',
                'serial_number',
                'status'
            )
            ->get();
    }

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
                'softwareInventory:id,software_name,version,publisher,license_type',
                'softwareLicense:id,license_key,max_activations,current_activations,account_user'
            ])
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'installation_date' => $s->installation_date,
                'status' => $s->status,
                'inventory' => $s->softwareInventory?->only([
                    'software_name',
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
