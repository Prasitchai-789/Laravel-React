<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgrSaleItem extends Model
{
    use SoftDeletes;

    protected $table = 'agr_sale_items';

    protected $fillable = [
        'sale_id',
        'product_id',
        'custom_product_id',
        'quantity',
        'unit_price',
        'line_total',
        'paid_amount',
        'payment_status',
    ];

    public function sale()
    {
        return $this->belongsTo(AgrSale::class, 'sale_id');
    }

    public function product()
    {
        return $this->belongsTo(AgrProduct::class, 'product_id');
    }

    public function payments()
    {
        return $this->hasMany(AgrPayment::class, 'sale_item_id');
    }

    /**
     * คำนวณสถานะชำระเงินรายสินค้าอัตโนมัติ
     */
    public function recalcPaymentStatus(): void
    {
        $paid = floatval($this->paid_amount);
        $total = floatval($this->line_total);

        if ($paid >= $total && $total > 0) {
            $this->payment_status = 'completed';
        } elseif ($paid > 0) {
            $this->payment_status = 'partial';
        } else {
            $this->payment_status = 'pending';
        }
        $this->save();
    }
}
