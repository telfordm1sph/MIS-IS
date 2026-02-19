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
    public static function getPlName($plId)
    {
        return self::where('PLID', $plId)->value('PLNAME');
    }
}
