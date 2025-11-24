<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CpoTank extends Model
{
     use HasFactory;

    protected $fillable = [
        'cpo_record_id',
        'tank_no',
        'oil_level',
        'temperature',
        'cpo_volume',
        'ffa',
        'moisture',
        'dobi',
        'top_ffa',
        'top_moisture',
        'top_dobi',
        'bottom_ffa',
        'bottom_moisture',
        'bottom_dobi',
    ];

    public function record() {
        return $this->belongsTo(CpoRecord::class, 'cpo_record_id');
    }
}
