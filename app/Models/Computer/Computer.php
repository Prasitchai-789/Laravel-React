<?php

namespace App\Models\Computer;

use Illuminate\Database\Eloquent\Model;

class Computer extends Model
{
    protected $connection = 'sqlsrv3';
    protected $table = 'Webapp_computers';
    // We only read from this table generally
    protected $guarded = [];
}
