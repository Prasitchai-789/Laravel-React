<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SOPlanStatus extends Model
{
    protected $connection = 'sqlsrv2';
    
    use HasFactory;
    protected $table = 'SOPlanStatus';
    protected $fillable =[

    ];
}
