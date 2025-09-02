<?php

namespace App\Models\WIN;

use App\Models\WIN\EMCust;
use App\Models\WIN\EMDept;
use App\Models\WIN\EMGood;
use App\Models\WIN\EMVendor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ICStockDetail extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'ICStockDetail';
    protected $primaryKey = 'DocuID'; // หรือ 'id' ถ้ามีคีย์อื่น
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable =[

    ];

    public function EMCust()
    {
        return $this->belongsTo(EMCust::class, 'CustID', 'CustID');
    }

    public function EMGood()
    {
        return $this->belongsTo(EMGood::class, 'GoodID', 'GoodID');
    }

    public function EMDept()
    {
        return $this->belongsTo(EMDept::class, 'DeptID', 'DeptID');
    }

    public function GoodUnit()
    {
        return $this->belongsTo(EMGoodUnit::class, 'GoodStockUnitID', 'GoodUnitID');
    }

    public function EMVendor()
    {
        return $this->belongsTo(EMVendor::class, 'VendorID', 'VendorID');
    }
}
