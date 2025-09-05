<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Certificate extends Model
{

    protected $connection = 'sqlsrv3';
    use HasFactory;

    protected $table = 'certificates';
    public $timestamps = false;
    // ฟิลด์ที่อนุญาตให้ mass assignment
    protected $fillable = [
        'coa_lot',
        'coa_number',
        'SOPID',
    ];
}
