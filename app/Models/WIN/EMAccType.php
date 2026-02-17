<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EMAccType extends Model
{
    protected $connection = 'sqlsrv2';
    
    use HasFactory;
    protected $table = 'EMAccType';
    protected $fillable =[

    ];
    protected $primaryKey = 'AccTypeID';
}
