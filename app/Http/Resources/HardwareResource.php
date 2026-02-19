<?php

namespace App\Http\Resources;

use App\Constants\Status;
use Illuminate\Http\Resources\Json\JsonResource;

class HardwareResource extends JsonResource
{
    public function toArray($request): array
    {
        // Assigned users — resolved names are set by the service before this runs
        $assignedUsers = collect($this->users)->map(function ($hu) {
            if (!isset($hu->resolved_name)) return null;

            return [
                'EMPLOYID' => $hu->user_id,
                'fullName' => $hu->resolved_name,
                'initials' => $hu->resolved_initials,
            ];
        })->filter()->values();

        return [
            'id'            => $this->id,
            'hostname'      => $this->hostname,
            'category'      => $this->category,
            'brand'         => $this->brand,
            'model'         => $this->model,
            'serial_number' => $this->serial_number,
            'processor'     => $this->processor,
            'motherboard'   => $this->motherboard,
            'ip_address'    => $this->ip_address,
            'wifi_mac'      => $this->wifi_mac,
            'lan_mac'       => $this->lan_mac,
            'remarks'       => $this->remarks,
            'status'        => $this->status,
            'status_label'  => Status::getLabel($this->status),
            'status_color'  => Status::getColor($this->status),
            'location'      => $this->location,
            'department'    => $this->department,
            'station'       => $this->station,
            'prodline'      => $this->prodline,
            'date_issued'   => $this->date_issued?->format('Y-m-d'),
            'created_at'    => $this->created_at?->format('Y-m-d H:i:s'),
            'installed_by'  => $this->installed_by,

            // Resolved reference names — attached by service
            'department_name' => $this->department_name ?? null,
            'location_name'   => $this->location_name ?? null,
            'station_name'    => $this->station_name ?? null,
            'prodline_name'   => $this->prodline_name ?? null,

            'installed_by_label' => $this->whenLoaded(
                'installedByUser',
                fn() => $this->installedByUser?->EMPNAME ?? $this->installed_by,
                $this->installed_by ?? ''
            ),

            'parts'    => HardwarePartResource::collection($this->whenLoaded('parts')),
            'software' => HardwareSoftwareResource::collection($this->whenLoaded('software')),

            'assignedUsers'    => $assignedUsers,
            'assignedUsersIds' => $assignedUsers->pluck('EMPLOYID')->values(),
            'issued_to_label'  => $assignedUsers->pluck('fullName')->implode(', '),
        ];
    }
}
