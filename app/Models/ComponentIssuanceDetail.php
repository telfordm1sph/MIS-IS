<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComponentIssuanceDetail extends Model
{
    protected $table = 'component_issuance_details';

    protected $fillable = [
        'issuance_id',
        'operation_type',
        'component_type',
        'old_component_id',
        'old_component_condition',
        'old_component_data',
        'new_component_id',
        'new_component_condition',
        'new_component_data',
        'hardware_changes',
        'reason',
        'remarks',
    ];

    protected $casts = [
        'old_component_data' => 'array',
        'new_component_data' => 'array',
        'hardware_changes' => 'array',
    ];

    /**
     * Get the parent issuance
     */
    public function issuance()
    {
        return $this->belongsTo(Issuance::class, 'issuance_id');
    }

    /**
     * Get old component (part)
     */
    public function oldPart()
    {
        return $this->belongsTo(HardwarePart::class, 'old_component_id')
            ->where('component_type', 'part');
    }

    /**
     * Get old component (software)
     */
    public function oldSoftware()
    {
        return $this->belongsTo(HardwareSoftware::class, 'old_component_id')
            ->where('component_type', 'software');
    }

    /**
     * Get new component (part)
     */
    public function newPart()
    {
        return $this->belongsTo(HardwarePart::class, 'new_component_id')
            ->where('component_type', 'part');
    }

    /**
     * Get new component (software)
     */
    public function newSoftware()
    {
        return $this->belongsTo(HardwareSoftware::class, 'new_component_id')
            ->where('component_type', 'software');
    }
}
