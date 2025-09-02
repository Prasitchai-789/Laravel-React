<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebappDept extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'Webapp_Dept';
    protected $primaryKey = 'DeptID';
    public $timestamps = false;
    protected $fillable =[

    ];
}
