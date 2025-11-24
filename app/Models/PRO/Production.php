<?php

namespace App\Models\PRO;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Production extends Model
{
    protected $connection = 'sqlsrv3';
    use HasFactory;
    protected $table = 'productions';
    public $timestamps = false;

    protected $fillable = [

    ];

}
