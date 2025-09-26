<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'good_id',
        'good_name',
        'unit',
        'stock_qty',
        'is_new',
    ];

    public function orderItems()
    {
        return $this->hasMany(StoreOrderItem::class, 'good_id', 'good_id');
    }
}
