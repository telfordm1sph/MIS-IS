<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Model;

class Promis extends Model
{
    use Loggable;
    protected $table = 'promis_terminal';
    protected $fillable = [
        'promis_name',
        'ip_address',
        'location',
        'model_name',
        'monitor',
        'mouse',
        'keyboard',
        'scanner',
        'badge_no',
        'status',

    ];
}
