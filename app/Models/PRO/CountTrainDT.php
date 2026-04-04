<?php

namespace App\Models\PRO;

use Illuminate\Database\Eloquent\Model;

class CountTrainDT extends Model
{
    protected $connection = 'sqlsrv3';
    protected $table = 'Webapp_CountTrainDT';
    
    protected $fillable = [
        'CTID',
        'CTList',
        'created_at',
        'updated_at',
        'CTGroupWork'
    ];
}
