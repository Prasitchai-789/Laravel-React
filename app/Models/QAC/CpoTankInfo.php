<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CpoTankInfo extends Model
{
    use HasFactory;

    protected $fillable = [
        'tank_no',
        'height_m',
        'diameter_m',
        'volume_m3',
    ];
}
