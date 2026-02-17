<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SOInvHD extends Model
{
    
    use HasFactory;
    protected $table = 'SOInvHD';
    protected $primaryKey = 'SOInvID';
    public $timestamps = false;

    protected $fillable = [
        'SaleAreaID',
        'CustID',
        'DocuDate',
        'NetAmnt',
        'DueDate',
        'SONo'
    ];

    // 📌 Invoice นี้มีรายละเอียดสินค้า
    public function details()
    {
        return $this->hasMany(SOInvDT::class, 'SOInvID', 'SOInvID');
    }

    // 📌 Invoice นี้ออกให้กับลูกค้าไหน
    public function customer()
    {
        return $this->belongsTo(EMCust::class, 'CustID', 'CustID');
    }

    // 📌 Invoice นี้อ้างอิงมาจาก Order ไหน
    public function order()
    {
        return $this->belongsTo(SOHD::class, 'SONo', 'DocuNo');
    }
}
