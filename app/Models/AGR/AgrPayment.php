<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;

class AgrPayment extends Model
{
    protected $table = 'agr_payments'; // ตารางตามที่คุณสร้าง
    protected $fillable = [
        'sale_id', 'paid_at', 'amount', 'method', 'note','new_payment','payment_slip'
    ];
}
