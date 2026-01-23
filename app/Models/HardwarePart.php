<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class HardwarePart extends Model
{
    use Loggable;

    protected $fillable = [
        'hardware_id',
        'part_type',
        'brand',
        'model',
        'specifications',
        'serial_number',
        'slot_position',
        'quantity',
        'status',
        'installed_date',
        'removed_date',
        'source_inventory_id',
        'remarks',
        'created_by',
        'updated_by'
    ];

    // Relationships
    public function hardware()
    {
        return $this->belongsTo(Hardware::class, 'hardware_id', 'hostname');
    }

    public function sourceInventory()
    {
        return $this->belongsTo(PartInventory::class, 'source_inventory_id');
    }

    public function part()
    {
        return $this->belongsTo(Part::class, 'part_id');
    }
}
