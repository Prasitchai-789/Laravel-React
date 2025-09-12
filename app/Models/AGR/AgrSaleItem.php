<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;

class AgrSaleItem extends Model
{
    protected $table = 'agr_sale_items';

    protected $fillable = [
        'sale_id',   // foreign key จริง
        'product_id',
        'quantity',
        'price',
        'line_total',
    ];

    // ความสัมพันธ์กลับไปยัง AgrSale
    public function sale()
    {
        return $this->belongsTo(AgrSale::class, 'sale_id'); // ระบุชื่อ column ที่ถูกต้อง
    }

    // ความสัมพันธ์ไปยังสินค้า
    public function product()
    {
        return $this->belongsTo(AgrProduct::class, 'product_id');
    }
}
