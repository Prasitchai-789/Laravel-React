<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoreOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_number',
        'order_date',
        'status',
        'department',
        'requester',
        'note',
    ];


      public function items()
    {
        return $this->hasMany(StoreOrderItem::class, 'store_order_id', 'id');
    }
}

