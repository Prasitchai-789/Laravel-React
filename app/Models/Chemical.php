<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chemical extends Model
{
    use HasFactory;

    // ฟิลด์ที่อนุญาตให้ mass assignment
    protected $fillable = [
        'name',
        'unit',
       
    ];
}
