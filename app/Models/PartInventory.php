<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;
use Illuminate\Support\Facades\DB;

class PartInventory extends Model
{
    use Loggable;

    protected $table = 'part_inventory';

    protected $fillable = [
        'part_id',
        'condition',
        'quantity',
        'location',
        'reorder_level',
        'reorder_quantity',
        'unit_cost',
        'supplier',
        'remarks',
    ];

    // Relationships
    public function part()
    {
        return $this->belongsTo(Part::class);
    }

    public function hardwareParts()
    {
        return $this->hasMany(HardwarePart::class, 'source_inventory_id');
    }
    public function scopeUsableGrouped($query)
    {
        return $query->where('quantity', '>', 0)
            ->where('condition', '!=', 'Defective')
            ->select(
                'part_id',
                'condition',
                DB::raw('SUM(quantity) as quantity')
            )
            ->groupBy('part_id', 'condition');
    }
}
