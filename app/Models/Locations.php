<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Locations extends Model
{
    protected $connection = 'qa';
    protected $table = 'location_list';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'location_name',


    ];
    public static function getLocationName($locId)
    {
        return self::where('id', $locId)->value('location_name');
    }
}
