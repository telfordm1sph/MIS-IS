<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class Part extends Model
{
    use Loggable;
    protected $table = 'parts';
    protected $fillable = [
        'part_type',
        'brand',
        'model',
        'specifications',
    ];


    public function inventories()
    {
        return $this->hasMany(PartInventory::class);
    }
}
