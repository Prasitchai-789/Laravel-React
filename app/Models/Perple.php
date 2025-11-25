<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Perple extends Model
{
    use HasFactory ;

    protected $fillable = [
        'title',
        'first_name',
        'last_name',
        'house_no',
        'village_no',
        'subdistrict_name',
        'district_name',
        'province_name',
        'note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
