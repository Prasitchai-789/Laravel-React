<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialAccountCategory extends Model
{
    protected $fillable = [
        'acc_code',
        'acc_name',
        'category',
        'type',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
