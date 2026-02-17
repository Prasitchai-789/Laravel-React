<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Shift;
class WebappDept extends Model
{
    protected $connection = 'sqlsrv2';
    
    use HasFactory;
    protected $table = 'Webapp_Dept';
    protected $primaryKey = 'DeptID';
    public $timestamps = false;
    protected $fillable =[

    ];






     public function shifts()
    {
        return $this->hasMany(Shift::class, 'department_id', 'DeptID');
    }
}
