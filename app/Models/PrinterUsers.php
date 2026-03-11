<?php

namespace App\Models;

use App\Traits\Loggable;
use Illuminate\Database\Eloquent\Model;

class PrinterUsers extends Model
{
    use Loggable;
    protected $table = 'printer_users';
    protected $connection = 'mysql';
    protected $fillable = [
        'printer_id',
        'user_id',
        'date_assigned',
        'assigned_by',
        'remarks',
    ];

    // Relationships


    public function printer()
    {
        return $this->belongsTo(Printer::class, 'printer_id');
    }


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'EMPLOYID');
        // printer_users.user_id matches employee_masterlist.EMPLOYID
    }
}
