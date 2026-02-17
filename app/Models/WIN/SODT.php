<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SODT extends Model
{
    protected $connection = 'sqlsrv2';
    
    use HasFactory;
    protected $table = 'SODT';
    public $timestamps = false;

    protected $fillable = [
        'RefSOID',
        'SOID',
        'ListNo',
        'DocuType',
        'GoodID',
        'GoodName',
        'GoodQty2',
        'GoodPrice2'
    ];

    // 📌 รายการนี้อยู่ใน SOHD ไหน
    public function order()
    {
        return $this->belongsTo(SOHD::class, 'SOID', 'SOID');
    }

    // 📌 รายการนี้เป็นสินค้าตัวไหน
    public function good()
    {
        return $this->belongsTo(EMGood::class, 'GoodID', 'GoodID');
    }
}
