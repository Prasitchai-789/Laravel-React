<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AgrStockTransaction extends Model
{
    use HasFactory;

    // ชื่อ table (ถ้าไม่ได้ตั้งตาม convention plural)
    protected $table = 'agr_stock_transactions';

    // กำหนด fields ที่สามารถ mass assignment ได้
    protected $fillable = [
        'product_id',
        'transaction_type',
        'quantity',
        'balance_after',
        'notes',
        'user_id'
    ];

    // ความสัมพันธ์กับ Product
    public function product()
    {
        return $this->belongsTo(AgrProduct::class, 'product_id');
    }
}
