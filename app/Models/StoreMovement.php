<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StoreMovement extends Model
{
    use HasFactory;
protected $table = 'store_movements';

protected $fillable = [
        'store_item_id',
        'store_order_id',
        'user_id',
        'movement_type', // reserve, issue, return, adjustment
        'category',      // stock / safety
        'type',          // add / subtract
        'quantity',
        'status',        // pending / approved / rejected
        'note',
    ];

    protected $casts = [
        'quantity' => 'float',
    ];

    public function item()
    {
        return $this->belongsTo(StoreItem::class, 'store_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
