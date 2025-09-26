<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoreItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'good_id',       // รหัสสินค้าอ้างอิงจาก Winspeed
        'good_code',     // ชื่อสินค้า
        'GoodUnitID',     // หน่วยนับ
        'stock_qty',     // จำนวนคงเหลือ
        'safety_stock',  // Safety Stock
        'price',         // ราคาต่อหน่วย
    ];

    // แปลงค่าให้อ่านเป็นตัวเลข
    protected $casts = [
        'stock_qty' => 'float',
        'safety_stock' => 'float',
        'price' => 'float',
    ];


    // Relation กับ movement
    public function movements()
    {
        return $this->hasMany(StoreMovement::class);
    }

    public function adjustStock(float $qty)
    {
        $this->stock_qty = max(0, $this->stock_qty + $qty);
        $this->save();
    }

    public function adjustSafety(float $qty)
    {
        $this->safety_stock = max(0, $this->safety_stock + $qty);
        $this->save();
    }

    public function storeItem()
    {
        return $this->belongsTo(StoreItem::class, 'good_id', 'good_id');
    }

}
