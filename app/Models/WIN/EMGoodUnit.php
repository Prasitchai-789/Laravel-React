<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EMGoodUnit extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'EMGoodUnit';
    public $timestamps = false;
    protected $fillable =[

    ];
    public function details()
    {
        return $this->hasMany(SOInvDT::class, 'GoodUnitID2', 'GoodUnitID');
    }
}
