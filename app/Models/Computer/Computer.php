<?php

namespace App\Models\Computer;

use Illuminate\Database\Eloquent\Model;

class Computer extends Model
{
    protected $connection = 'sqlsrv3';
    protected $table = 'Webapp_computers';
    
    protected $casts = [
        'id' => 'integer',
    ];
    
    // We only read from this table generally
    protected $guarded = [];
}
