<?php

namespace App\Models\PRO;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FFBCountProduction extends Model
{
    protected $connection = 'sqlsrv3';
    use HasFactory;
    protected $table = 'ffb_count_productions';
    public $timestamps = false;

    protected $fillable = [
        'Date',
        'Shift',
        'Quantity',
    ];
}
