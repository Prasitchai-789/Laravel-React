<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\WIN\WebappEmp;
use App\Models\Shift;

class ShiftAssignment extends Model
{
    use HasFactory;

 
    protected $connection = 'sqlsrv';

    protected $table = 'shift_assignments';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'employee_id',
        'shift_id',
        'date',
    ];

    /**
     * ความสัมพันธ์กับ Shift (อยู่บน default connection)
     */
    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id', 'id')
            ->setConnection(config('database.default')); // สำคัญมาก
    }

    /**
     * ความสัมพันธ์กับ WebappEmp (อยู่บน sqlsrv2)
     */
    public function employee()
    {
        return $this->belongsTo(WebappEmp::class, 'employee_id', 'EmpID');
    }
}
