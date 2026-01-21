<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class Hardware extends Model
{
    use Loggable;

    protected $fillable = [
        'hostname',
        'category',
        'brand',
        'model',
        'serial_number',
        'processor',
        'motherboard',
        'ip_address',
        'wifi_mac',
        'lan_mac',
        'remarks',
        'status',
        'location',
        'department',
        'issued_to',
        'installed_by',
        'date_issued',
        'created_by',
        'updated_by'
    ];

    public function parts()
    {
        return $this->hasMany(HardwarePart::class, 'hardware_id', 'hostname');
    }

    public function software()
    {
        return $this->hasMany(HardwareSoftware::class, 'hardware_id', 'hostname');
    }
}
