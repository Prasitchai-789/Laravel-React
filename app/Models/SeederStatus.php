<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeederStatus extends Model
{
    // ชื่อตาราง (ถ้าใช้ชื่อ default laravel จะเป็น seeder_statuses)
    protected $table = 'seeder_status';

    // กำหนด field ที่สามารถ mass assign ได้
    protected $fillable = [
        'name',
    ];

    // ไม่ต้อง timestamps ก็ได้ถ้าไม่ใช้
    // public $timestamps = false;

    // ถ้าต้องการ cast วันเวลา
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
