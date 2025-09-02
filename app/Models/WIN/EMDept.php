<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EMDept extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'EMDept';
    protected $primaryKey = 'DeptID'; // ระบุชื่อคอลัมน์ที่เป็น Primary Key ของตาราง
    protected $fillable =[

    ];
}
