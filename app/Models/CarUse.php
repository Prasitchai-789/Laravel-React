<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarUse extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'sqlsrv3';

    /**
     * The table associated with the model.
     */
    protected $table = 'car_uses';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'card_id',
        'car_id',
        'user_request',
        'use_job',
        'use_start',
        'use_end',
        'use_distance',
        'use_status',
        'additionalNotes',
    ];

    /**
     * Get the car report (vehicle info) associated with this usage.
     */
    public function carReport()
    {
        return $this->belongsTo(CarReport::class, 'card_id', 'id');
    }
}
