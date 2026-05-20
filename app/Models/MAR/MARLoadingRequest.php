<?php

namespace App\Models\MAR;

use Illuminate\Database\Eloquent\Model;

class MARLoadingRequest extends Model
{
    protected $table = 'mar_loading_requests';

    protected $fillable = [
        'request_number',
        'request_date',
        'sequence',
        'SOPID',
        'GoodID',
        'NumberCar',
        'CustID',
    ];

    protected $casts = [
        'request_date' => 'date',
        'sequence' => 'integer',
    ];
}
