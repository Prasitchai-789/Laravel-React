<?php

namespace App\Models\MAR;

use Illuminate\Database\Eloquent\Model;

class DeliveryPlanReference extends Model
{
    /**
     * The connection name for the model.
     *
     * @var string
     */
    protected $connection = 'sqlsrv';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'delivery_plan_references';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'ref_key',
        'ref_value',
    ];
}
