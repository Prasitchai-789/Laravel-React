<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PODT extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'PODT';
    protected $fillable = [];
    protected $primaryKey = 'POID';

    public function header()
    {
        return $this->belongsTo(POHD::class, 'POID', 'POID');
    }
}
