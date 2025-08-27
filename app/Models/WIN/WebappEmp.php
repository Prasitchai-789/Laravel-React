<?php

namespace App\Models\WIN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WebappEmp extends Model
{
    //
    protected $connection = 'sqlsrv2';
    
    use HasFactory;
    protected $table = 'webapp_emp';
    protected $primaryKey = 'EmpID';

    public $timestamps = false;
    // ฟิลด์ที่อนุญาตให้ mass assignment
    protected $fillable = [

    ];

       public function user()
    {
        return $this->hasOne(User::class, 'employee_id', 'EmpID');
    }
}
