<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleInspection extends Model
{
    protected $connection = 'sqlsrv';
    protected $table = 'vehicle_inspections';

    protected $fillable = [
        'sop_id',
        'is_clean',
        'is_covered',
        'is_no_smell',
        'is_doc_valid',
        'remark',
        'inspector_name',
    ];

    protected $casts = [
        'is_clean' => 'boolean',
        'is_covered' => 'boolean',
        'is_no_smell' => 'boolean',
        'is_doc_valid' => 'boolean',
    ];
}
