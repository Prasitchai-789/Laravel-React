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
    protected $fillable = ['GoodCode', 'GoodName1'];
    // 📌 สินค้านี้อยู่ใน Order Detail
    public function orderDetails()
    {
        return $this->hasMany(SODT::class, 'GoodID', 'GoodID');
    }

    // 📌 สินค้านี้อยู่ใน Invoice Detail
    public function invoiceDetails()
    {
        return $this->hasMany(SOInvDT::class, 'GoodID', 'GoodID');
    }
    public function soplans()
    {
        // return $this->hasMany(SalesPlan::class, 'GoodID', 'GoodID');
    }
}
