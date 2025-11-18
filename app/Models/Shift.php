<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\WIN\WebappEmp;
use App\Models\WIN\WebappDept;
use App\Models\Holiday;

class Shift extends Model
{
    use HasFactory;

    protected $table = 'shifts';

    protected $fillable = [
        'shift_number',
        'start_time',
        'end_time',
        'total_hours',
        'name',
        'description',
        'department_id',      // เก็บ DeptID เฉย ๆ
        'overtime_allowed',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'overtime_allowed' => 'boolean',
    ];

    /**
     * Relationship กับ WebappDept
     * **ไม่ใช้ foreign key ใน DB** แต่ Eloquent join ได้
     */
    public function department()
    {
        return $this->belongsTo(WebappDept::class, 'department_id', 'DeptID');
    }

    public function employees()
    {
        return $this->belongsToMany(
            WebappEmp::class,
            'shift_assignments', // table อยู่ใน default connection
            'shift_id',
            'employee_id'
        )->withTimestamps();
    }

    public function holidays()
    {
        return $this->belongsToMany(Holiday::class, 'shift_holiday', 'shift_id', 'holiday_id')
            ->withTimestamps();
    }
}
