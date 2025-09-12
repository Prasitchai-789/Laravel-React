<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AgrProduct extends Model
{
    use HasFactory;

    // ถ้าชื่อตารางไม่ตรงกับ convention ของ Laravel ให้ระบุชื่อ
    protected $table = 'agr_products';

    // กำหนดคอลัมน์ที่สามารถ Mass Assignment ได้
    protected $fillable = [
        'sku',
        'name',
        'category',
        'price',
        'stock',
        'notes',
        'store_id',
    ];

    // หากคุณใช้คีย์ primary key ที่ไม่ใช่ id
    // protected $primaryKey = 'id';

    // หากต้องการกำหนดชนิดข้อมูลให้กับคอลัมน์
    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    // หากต้องการเชื่อมความสัมพันธ์กับ LocationStore
    public function location()
    {
        return $this->belongsTo(LocationStore::class, 'store_id', 'id');
    }

}
