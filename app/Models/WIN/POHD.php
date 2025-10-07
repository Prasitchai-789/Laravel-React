<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class POHD extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'POHD';
    protected $fillable = [];
    protected $primaryKey = 'POID';

    public function details()
    {
        return $this->hasMany(PODT::class, 'POID', 'POID');
    }
}
