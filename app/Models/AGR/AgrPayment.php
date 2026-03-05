<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgrPayment extends Model
{
    use SoftDeletes;

    protected $table = 'agr_payments';
    protected $fillable = [
        'sale_id', 'sale_item_id', 'paid_at', 'amount', 'method', 'note', 'new_payment', 'payment_slip'
    ];

    public function sale()
    {
        return $this->belongsTo(AgrSale::class, 'sale_id');
    }

    public function saleItem()
    {
        return $this->belongsTo(AgrSaleItem::class, 'sale_item_id');
    }
}
