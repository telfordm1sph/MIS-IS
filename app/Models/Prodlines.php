<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prodlines extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'tblpls';
    protected $primaryKey = 'PLID';
    public $timestamps = false;

    protected $fillable = [
        'PLNAME',


    ];
}
