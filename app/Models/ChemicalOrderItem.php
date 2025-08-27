<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChemicalOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'chemical_id',
        'quantity',
        'remaining_quantity',
        'unit',
        'unit_price',
        'total_price',
        'expiry_date',
    ];

    public function chemical()
    {
        return $this->belongsTo(Chemical::class, 'chemical_id');
    }

    public function order()
    {
        return $this->belongsTo(ChemicalOrder::class, 'order_id');
    }
}
