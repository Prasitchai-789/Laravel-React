<?php

namespace App\Models\PRO;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Production extends Model
{
    protected $connection = 'sqlsrv3';
    use HasFactory;
    protected $table = 'productions';
    public $timestamps = true;

    protected $fillable = [
        'Date',
        'FFBPurchase',
        'FFBForward',
        'ShiftA',
        'ShiftB',
        'Shift3',
        'PickupRemain',
        'RamRemain',
        'TotalFFB',
        'AvgPickup',
        'FFBGoodQty',
        'StuckIn',
        'Steam',
        'PickupRemain2',
        'RamRemain2',
        'RawFFB',
        'FFBRemain',
        'CS1',
        'CS2',
    ];

    protected $casts = [
        'CS1' => 'float',
        'CS2' => 'float',
    ];
}
