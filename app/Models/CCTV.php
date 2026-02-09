<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Model;

class CCTV extends Model
{
    use Loggable;
    protected $table = 'cctv_lists';
    protected $fillable = [
        'camera_name',
        'channel',
        'ip_address',
        'control_no',
        'location',
        'location_ip',
        'status',

    ];
}
