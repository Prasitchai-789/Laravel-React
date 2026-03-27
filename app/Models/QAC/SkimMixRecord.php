<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SkimMixRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'oil_level',
        'temperature',
        'volume',
        'difference',
        'type',
    ];

    protected $casts = [
        'oil_level' => 'decimal:3',
        'temperature' => 'decimal:3',
        'volume' => 'decimal:3',
        'difference' => 'decimal:3',
    ];
}
