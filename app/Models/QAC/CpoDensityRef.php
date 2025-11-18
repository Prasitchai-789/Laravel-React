<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CpoDensityRef extends Model
{
    use HasFactory;

    protected $fillable = [
        'temperature_c',
        'density',
    ];
}
