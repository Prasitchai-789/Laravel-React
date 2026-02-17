<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SOHD extends Model
{
    
    use HasFactory;
    protected $table = 'SOHD';
    protected $primaryKey = 'SOID';
    public $timestamps = false;

    protected $fillable = [
        'SaleAreaID',
        'CurrID',
        'DocuNo',
        'DocuDate',
        'ShipToAddr1'
    ];

    // 📌 1 SOHD มีหลาย SODT (รายละเอียดสินค้าใน Order)
    public function details()
    {
        return $this->hasMany(SODT::class, 'SOID', 'SOID');
    }

    // 📌 1 SOHD มีหลาย Invoice (เชื่อมผ่าน DocuNo → SONo)
    public function invoices()
    {
        return $this->hasMany(SOInvHD::class, 'SONo', 'DocuNo');
    }
}
