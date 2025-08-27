<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChemicalOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'lot_number',
        'order_date',
        'status',
        'created_by',
        'notes',
    ];

    public function items()
    {
        return $this->hasMany(ChemicalOrderItem::class, 'order_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
