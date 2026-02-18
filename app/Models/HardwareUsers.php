<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HardwareUsers extends Model
{
    protected $table = 'hardware_users';
    protected $connection = 'mysql';
    protected $fillable = [
        'hardware_id',
        'user_id',
        'date_assigned',
        'assigned_by',
        'remarks',
    ];

    // Relationships


    public function hardware()
    {
        return $this->belongsTo(Hardware::class, 'hardware_id');
    }


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'EMPLOYID');
        // hardware_users.user_id matches employee_masterlist.EMPLOYID
    }
}
