<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class SoftwareInventory extends Model
{
    use Loggable;
    protected $table = 'software_inventory';
    protected $fillable = [
        'software_name',
        'software_type',
        'version',
        'publisher',
        'license_type',
        'requires_key_tracking',
        'total_licenses',
        'notes'
    ];

    public function licenses()
    {
        return $this->hasMany(SoftwareLicense::class);
    }

    public function hardwareSoftware()
    {
        return $this->hasMany(HardwareSoftware::class);
    }
}
