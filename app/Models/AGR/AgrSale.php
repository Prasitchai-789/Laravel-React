<?php

namespace App\Models\AGR;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

class AgrSale extends Model
{
     protected $fillable = [
      'invoice_no','customer_id','sale_date','pickup_date','status',
      'total_amount','deposit','deposit_percent','paid_amount','balance_due','notes'
    ];

    public function customer(){ return $this->belongsTo(AgrCustomer::class); }
    public function items(){ return $this->hasMany(AgrSaleItem::class); }
    public function payments(){ return $this->hasMany(AgrPayment::class); }

    public function recalcTotals(){
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
