<?php

namespace App\Models\WIN;

use App\Models\WIN\EMGoodUnit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ICStockDT extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'ICStockDT';
    protected $fillable =[

    ];

    public function GoodUnit()
    {
        return $this->belongsTo(EMGoodUnit::class, 'GoodStockUnitID', 'GoodUnitID');
    }
}
