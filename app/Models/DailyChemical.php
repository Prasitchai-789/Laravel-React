<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyChemical extends Model
{
    // กำหนดชื่อ table ถ้าไม่ตรงกับ convention
    protected $table = 'daily_chemicals';

    // ถ้าใช้ mass assignment ต้องกำหนด fillable
    protected $fillable = [
        'date',
        'shift',
        'chemical_name',
        'unit',
        'quantity',
    ];

    // ถ้า table มี created_at, updated_at ให้เปิด (default = true)
    public $timestamps = true;
}
