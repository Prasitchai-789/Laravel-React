<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class POHD extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'POHD';
    protected $primaryKey = 'POID';
    public $timestamps = false;
    protected $fillable = [
        'DocuDate', 'DocuNo', 'DeptID', 'ReqByID', 'DocuType', 'AppvDate'
    ];

    public function details()
    {
        return $this->hasMany(PODT::class, 'POID', 'POID');
    }
    public function department()
    {
        return $this->belongsTo(EMDept::class, 'DeptID', 'DeptID');
    }
    public function requester()
    {
        // return $this->belongsTo(EMEmp::class, 'ReqByID', 'EmpID');
    }
}
