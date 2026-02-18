<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stations extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'tblstations';
    protected $primaryKey = 'STATIONID';
    public $timestamps = false;

    protected $fillable = [
        'STATIONNAME',


    ];
}
