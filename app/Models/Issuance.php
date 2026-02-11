<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Issuance extends Model
{
    protected $table = 'issuance';
    public $timestamps = false;

    protected $fillable = [
        'request_number',
        'issued_to',
        'hostname',
        'location',
        'remarks',
        'created_by',
    ];

    protected $dates = ['created_at'];

    /**
     * Acknowledgement for this whole unit issuance
     */
    public function acknowledgement()
    {
        return $this->hasOne(Acknowledgement::class, 'reference_id')
            ->where('reference_type', 1);
    }

    /**
     * This relationship is NOT for component issuances.
     * This is only for items that are part of a bundled issuance package,
     * if you have a scenario where multiple items are issued together
     * under one issuance record.
     * 
     * For individual component additions/replacements, those IssuanceItems
     * will have issuance_id = NULL and reference hardware_id instead.
     */
    public function items()
    {
        return $this->hasMany(IssuanceItem::class, 'issuance_id');
    }

    /**
     * Get the hardware associated with this issuance
     */
    public function hardware()
    {
        return $this->belongsTo(Hardware::class, 'hostname', 'hostname');
    }

    /**
     * Get who created this issuance
     */
    public function creator()
    {
        return $this->belongsTo(Masterlist::class, 'created_by', 'EMPLOYID');
    }

    /**
     * Get who this was issued to
     */
    public function recipient()
    {
        return $this->belongsTo(Masterlist::class, 'issued_to', 'EMPLOYID');
    }
}
