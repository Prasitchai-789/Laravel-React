<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;

    // ตาราง
    protected $table = 'holidays';

    // Mass assignable
    protected $fillable = [
        'name',
        'date',
        'description',
    ];

    // Timestamps เปิดอยู่ตาม default
    public $timestamps = true;

    /**
     * ความสัมพันธ์กับ Shift (many-to-many)
     */
    public function shifts()
    {
        return $this->belongsToMany(Shift::class, 'shift_holiday', 'holiday_id', 'shift_id')
            ->withTimestamps();
    }
}
