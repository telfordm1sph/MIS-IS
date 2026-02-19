<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HardwarePartResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'part_type'      => $this->part_type,
            'brand'          => $this->brand,
            'model'          => $this->model,
            'specifications' => $this->specifications,
            'serial_number'  => $this->serial_number,
            'condition'      => $this->condition,
            // 'installed_date' => $this->installed_date?->format('Y-m-d'),
        ];
    }
}
