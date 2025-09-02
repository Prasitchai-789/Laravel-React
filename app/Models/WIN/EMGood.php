<?php

namespace App\Models\WIN;

use App\Models\MAR\SalesPlan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EMGood extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'EMGood';
    protected $primaryKey = 'GoodID';
    public $timestamps = false;
    protected $fillable =[

    ];
    public function details()
    {
        return $this->hasMany(SOInvDT::class, 'GoodID', 'GoodID');
    }
    public function soplans()
    {
        // return $this->hasMany(SalesPlan::class, 'GoodID', 'GoodID');
    }
}
