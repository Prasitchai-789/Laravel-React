<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Education extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'Webapp_Education';
    protected $fillable =[

    ];
}
