<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'loggable_type',
        'loggable_id',
        'action_type',
        'action_by',
        'action_at',
        'old_values',
        'new_values',
        'remarks',
        'related_type',
        'related_id',
        'metadata'
    ];

    protected $casts = [
        'action_at' => 'datetime',
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function loggable()
    {
        return $this->morphTo();
    }

    public function related()
    {
        return $this->morphTo('related');
    }
}
