<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebappWorkOrder extends Model
{
    protected $connection = 'sqlsrv2'; // ใช้ connection sqlsrv2

    protected $table = 'Webapp_work_orders';

    public $timestamps = false; // เพราะ table มี datetime แต่ column เป็น nullable

    protected $fillable = [
        'Date', 'NameOfInformant', 'Status', 'TypeWork', 'Number',
        'MachineName', 'MachineCode', 'Detail', 'Location', 'WorkStatus',
        'Technician', 'RepairReport', 'RepairDate', 'Remark', 'Image', 'Telephone'
    ];
}
