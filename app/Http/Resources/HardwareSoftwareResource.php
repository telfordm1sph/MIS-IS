<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HardwareSoftwareResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                    => $this->id,
            'software_inventory_id' => $this->software_inventory_id,
            'software_license_id'   => $this->software_license_id,
            // 'installation_date'     => $this->installation_date?->format('Y-m-d'),
            'status'                => $this->status,
            'inventory'             => $this->whenLoaded('softwareInventory', fn() => [
                'id'            => $this->softwareInventory->id,
                'software_name' => $this->softwareInventory->software_name,
                'software_type' => $this->softwareInventory->software_type,
                'version'       => $this->softwareInventory->version,
            ]),
            'license'               => $this->whenLoaded('softwareLicense', fn() => [
                'id'           => $this->softwareLicense->id,
                'license_key'  => $this->softwareLicense->license_key,
                'account_user' => $this->softwareLicense->account_user,
            ]),
        ];
    }
}
