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
        'prodline',
        'station',
        'installed_by',
        'date_issued',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'date_issued' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Activity logs
    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'loggable')->latest('action_at');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', \App\Constants\Status::ACTIVE);
    }

    // Relationships

    // Installed by user
    public function installedByUser()
    {
        return $this->belongsTo(User::class, 'installed_by')
            ->select('EMPLOYID', 'EMPNAME');
    }

    // Hardware parts
    public function parts()
    {
        return $this->hasMany(HardwarePart::class, 'hardware_id', 'id');
    }

    // Hardware software
    public function software()
    {
        return $this->hasMany(HardwareSoftware::class, 'hardware_id', 'id');
    }

    // NEW: Assigned users (multi-user)
    public function users()
    {
        return $this->hasMany(HardwareUsers::class, 'hardware_id');
    }


    public function hardwareUsers()
    {
        return $this->hasMany(HardwareUsers::class, 'hardware_id');
    }

    public function assignedUsers()
    {
        return $this->hardwareUsers()->with('user');
    }
}
