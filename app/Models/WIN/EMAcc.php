<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EMAcc extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'EMAcc';
    protected $fillable =[

    ];
    protected $primaryKey = 'AccID';
}
