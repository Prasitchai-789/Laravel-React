<?php

namespace App\Models\MAR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SOPlan extends Model
{
    protected $connection = 'sqlsrv2';

    use HasFactory;
    protected $table = 'SOPlan';
    protected $primaryKey = 'SOPID'; 
    public $timestamps = false;
}
