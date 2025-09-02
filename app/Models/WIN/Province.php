<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'Webapp_Province';
    protected $primaryKey = 'ProvinceID';
    protected $fillable =[
        'ProvinceID',
    ];
}
