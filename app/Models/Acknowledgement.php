<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Acknowledgement extends Model
{
    protected $table = 'acknowledgements';
    public $timestamps = false;

    protected $fillable = [
        'reference_type',
        'reference_id',
        'acknowledged_by',
        'status',
        'acknowledged_at',
        'remarks',
    ];

    protected $dates = ['created_at', 'acknowledged_at'];

    public function acknowledgedByEmployee()
    {
        return $this->belongsTo(Masterlist::class, 'acknowledged_by', 'EMPLOYID');
    }

    /**
     * Get the issuance record (whole unit issuance)
     * Only loads when reference_type = 1
     */
    public function issuance()
    {
        return $this->belongsTo(Issuance::class, 'reference_id', 'id');
    }

    /**
     * Get the issuance item record (individual component)
     * Only loads when reference_type = 2
     */
    public function issuanceItem()
    {
        return $this->belongsTo(IssuanceItem::class, 'reference_id', 'id');
    }
}
