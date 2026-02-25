<?php

namespace App\Models\MAR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class SOPlan extends Model
{
    protected $connection = 'sqlsrv2';

    use HasFactory, SoftDeletes;

    protected $table = 'SOPlan';
    protected $primaryKey = 'SOPID';
    public $timestamps = false;

    /**
     * ชื่อคอลัมน์ soft-delete ใน DB (Laravel default คือ deleted_at)
     */
    const DELETED_AT = 'deleted_at';

    protected $fillable = [
        'SOPDate',
        'GoodID',
        'GoodName',
        'NumberCar',
        'DriverName',
        'CustID',
        'Recipient',
        'AmntLoad',
        'Status',
        'Remarks',
        'ReceivedDate',
        'Status_coa',
        'IBWei',
        'OBWei',
        'NetWei',
        'GoodPrice',
        'GoodAmnt',
    ];

    protected $dates = ['deleted_at'];
}
