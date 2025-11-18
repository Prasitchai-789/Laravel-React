<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CPOData extends Model
{
    use HasFactory;

    protected $table = 'cpo_data';

    protected $fillable = [
        'date',
        // Tank 1
        'tank1_oil_level', 'tank1_temperature', 'tank1_cpo_volume',
        'tank1_ffa', 'tank1_moisture', 'tank1_dobi',
        // Tank 2
        'tank2_oil_level', 'tank2_temperature', 'tank2_cpo_volume',
        'tank2_top_ffa', 'tank2_top_moisture', 'tank2_top_dobi',
        'tank2_bottom_ffa', 'tank2_bottom_moisture', 'tank2_bottom_dobi',
        // Tank 3
        'tank3_oil_level', 'tank3_temperature', 'tank3_cpo_volume',
        'tank3_top_ffa', 'tank3_top_moisture', 'tank3_top_dobi',
        'tank3_bottom_ffa', 'tank3_bottom_moisture', 'tank3_bottom_dobi',
        // Tank 4
        'tank4_oil_level', 'tank4_temperature', 'tank4_cpo_volume',
        'tank4_top_ffa', 'tank4_top_moisture', 'tank4_top_dobi',
        'tank4_bottom_ffa', 'tank4_bottom_moisture', 'tank4_bottom_dobi',
        // Oil Room
        'total_cpo', 'ffa_cpo', 'dobi_cpo', 'cs1_cm',
        'undilute_1', 'undilute_2', 'setting', 'clean_oil' ,'skim','mix','loop_back'
    ];


}
