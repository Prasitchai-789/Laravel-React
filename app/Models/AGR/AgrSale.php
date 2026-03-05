<?php

namespace App\Models\AGR;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgrSale extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'invoice_no',
        'sale_date',
        'customer_id',
        'quantity',
        'price',
        'sale_date',
        'pickup_date',
        'status',
        'total_amount',
        'deposit',
        'deposit_percent',
        'paid_amount',
        'balance_due',
        'notes',
        'product_id',
        'store_id',
        'shipping_cost',
        'payment_status',
    ];

    public function customer()
    {
        return $this->belongsTo(AgrCustomer::class);
    }
    public function items()
    {
        return $this->hasMany(AgrSaleItem::class, 'sale_id'); // ระบุชื่อ column foreign key จริง
    }

    public function payments()
    {
        return $this->hasMany(AgrPayment::class, 'sale_id');
    }

    public function recalcTotals()
    {
        $total = $this->items()->sum(DB::raw('line_total'));
        $deposit = round($total * ($this->deposit_percent / 100), 2);
        $paid = $this->payments()->sum('amount');
        $balance = $total - $paid;
        $this->update([
            'total_amount' => $total,
            'deposit' => $deposit,
            'paid_amount' => $paid,
            'balance_due' => $balance
        ]);
    }
}
