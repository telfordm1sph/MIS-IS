<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Issuance extends Model
{
    protected $table = 'issuance';
    public $timestamps = false;

    protected $fillable = [
        'issuance_number',
        'issuance_type',
        'request_number',
        'hostname',
        'hardware_id',
        'location',
        'remarks',
        'created_by',
    ];

    protected $dates = ['created_at'];

    protected $casts = [
        'issuance_type' => 'integer',
    ];

    /**
     * Acknowledgement for this issuance
     */
    public function acknowledgement()
    {
        return $this->hasOne(Acknowledgement::class, 'reference_id')
            ->where('reference_type', 1);
    }

    /**
     * Component issuance details (for issuance_type = 2)
     */
    public function componentDetails()
    {
        return $this->hasMany(ComponentIssuanceDetail::class, 'issuance_id');
    }

    /**
     * Get the hardware associated with this issuance
     */
    public function hardware()
    {
        return $this->belongsTo(Hardware::class, 'hardware_id', 'id');
    }

    /**
     * Get who created this issuance
     */
    public function creator()
    {
        return $this->belongsTo(Masterlist::class, 'created_by', 'EMPLOYID');
    }



    /**
     * Scope for whole unit issuances
     */
    public function scopeWholeUnit($query)
    {
        return $query->where('issuance_type', 1);
    }

    /**
     * Scope for component maintenance issuances
     */
    public function scopeComponentMaintenance($query)
    {
        return $query->where('issuance_type', 2);
    }
}
