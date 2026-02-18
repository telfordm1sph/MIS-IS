<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Departments extends Model
{
    protected $connection = 'masterlist';
    protected $table = 'tbldepts';
    protected $primaryKey = 'DEPTID';
    public $timestamps = false;

    protected $fillable = [
        'DEPTNAME',


    ];
}
