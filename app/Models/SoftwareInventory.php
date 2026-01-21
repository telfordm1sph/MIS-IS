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
        'assigned_licenses',
        'subscription_start',
        'subscription_end',
        'renewal_reminder_days',
        'cost_per_license',
        'total_cost',
        'purchase_date',
        'purchase_order',
        'vendor',
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
