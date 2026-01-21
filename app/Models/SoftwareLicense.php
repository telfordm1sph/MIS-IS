<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class SoftwareLicense extends Model
{
    use Loggable;
    protected $table = 'software_licenses';
    protected $fillable = [
        'software_inventory_id',
        'license_key',
        'account_user',
        'account_password',
        'max_activations',
        'current_activations',
        'remarks',
        'created_by',
        'updated_by'
    ];

    public function software()
    {
        return $this->belongsTo(SoftwareInventory::class, 'software_inventory_id');
    }

    public function hardwareSoftware()
    {
        return $this->hasMany(HardwareSoftware::class, 'software_license_id');
    }
}
