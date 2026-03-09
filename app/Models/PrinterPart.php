<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class PrinterPart extends Model
{
    use Loggable;

    protected $fillable = [
        'hardware_id',
        'part_type',
        'brand',
        'model',
        'specifications',
        'serial_number',
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
    public function printer()
    {
        return $this->belongsTo(Printer::class, 'printer_id', 'id');
    }

    public function sourceInventory()
    {
        return $this->belongsTo(PartInventory::class, 'source_inventory_id');
    }

    public function part()
    {
        return $this->belongsTo(Part::class, 'part_id', 'id');
    }
}
