<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockProduct extends Model
{
    use HasFactory;

    protected $table = 'stock_products';

    protected $fillable = [
        'record_date',
        'cpo',
        'pkn',
        'pkn_out',
        'efb_fiber',
        'efb',
        'shell',
        'nut',
        'nut_out',
        'silo_1',
        'silo_2',
    ];
}
