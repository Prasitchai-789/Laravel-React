<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CpoOilRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'cpo_record_id',
        'total_cpo',
        'ffa_cpo',
        'dobi_cpo',
        'cs1_cm',
        'undilute_1',
        'undilute_2',
        'setting',
        'clean_oil',
    ];

    public function record() {
        return $this->belongsTo(CpoRecord::class, 'cpo_record_id');
    }
}
