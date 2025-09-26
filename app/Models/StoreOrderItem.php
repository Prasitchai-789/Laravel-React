<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\WIN\EMGood; // ดึงสินค้าจาก Winspeed

class StoreOrderItem extends Model
{
    use HasFactory;

    protected $fillable = ['store_order_id', 'good_id', 'quantity', 'unit'];

    public function order()
    {
        return $this->belongsTo(StoreOrder::class, 'store_order_id');
    }

    public function good()
    {
        return $this->belongsTo(EMGood::class, 'good_id', 'GoodID');
    }

    public function movements()
    {
        return $this->hasMany(StoreMovement::class, 'store_item_id', 'id');
    }

    public function storeItem()
    {
        return $this->hasOne(StoreItem::class, 'good_id', 'good_id');
    }


}
