<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class Printer extends Model
{
    use Loggable;
    protected $table = 'printer';
    protected $fillable = [
        'printer_name',
        'ip_address',
        'printer_type',
        'printer_category',
        'location',
        'brand',
        'model',
        'serial_number',
        'category_status',
        'supplier',
        'status',
    ];

    // Relationships
    public function parts()
    {
        return $this->hasMany(PrinterPart::class, 'printer_id', 'id');
    }
    public function locationDetail()
    {
        return $this->belongsTo(Locations::class, 'location', 'id');
    }
}
