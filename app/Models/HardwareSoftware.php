<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Loggable;

class HardwareSoftware extends Model
{
    use Loggable;

    protected $fillable = [
        'hardware_id',
        'software_inventory_id',
        'software_license_id',
        'installation_date',
        'installed_by',
        'status',
        'uninstall_date',
        'remarks'
    ];

    public function hardware()
    {
        return $this->belongsTo(Hardware::class, 'hardware_id', 'id');
    }

    public function softwareInventory()
    {
        return $this->belongsTo(SoftwareInventory::class, 'software_inventory_id');
    }

    public function softwareLicense()
    {
        return $this->belongsTo(SoftwareLicense::class, 'software_license_id');
    }
}
