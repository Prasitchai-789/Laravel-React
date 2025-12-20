<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebappUsecar extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'sqlsrv2';

    /**
     * The table associated with the model.
     */
    protected $table = 'Webapp_usecars';

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
        'deleted_at' => 'datetime',
    ];

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'CardEmp',
        'EmpCode',
        'Mission',
        'CardCar',
        'NumberCar',
        'DeptIDEmp',
        'MileageA',
        'Status',
        'Distance',
        'Remark',
        'MileageB',
    ];
}
