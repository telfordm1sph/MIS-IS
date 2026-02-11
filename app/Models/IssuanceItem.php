<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssuanceItem extends Model
{
    protected $table = 'issuance_items';
    public $timestamps = false;

    protected $fillable = [
        'issuance_id',      // NULL for individual component additions/replacements
        'hardware_id',      // Reference to the hardware this component is issued to
        'item_type',        // 'part' or 'software'
        'item_id',          // ID of the actual part or software record
        'item_name',        // Display name of the component
        'description',      // Additional details
        'quantity',         // Usually 1 for components
        'serial_number',    // Serial number or license key
        'remarks',          // Additional notes
        'created_by',       // Who created the issuance
    ];

    protected $dates = ['created_at'];


    /**
     * Relationship to Hardware (the hardware this component is issued to)
     */
    public function hardware()
    {
        return $this->belongsTo(Hardware::class, 'hardware_id');
    }

    /**
     * Relationship to Acknowledgement
     */
    public function acknowledgement()
    {
        return $this->hasOne(Acknowledgement::class, 'reference_id')
            ->where('reference_type', 2);
    }

    /**
     * Get the actual part or software record based on item_type
     */
    public function getItemRecord()
    {
        if ($this->item_type === 'part') {
            return HardwarePart::find($this->item_id);
        } elseif ($this->item_type === 'software') {
            return HardwareSoftware::find($this->item_id);
        }

        return null;
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
