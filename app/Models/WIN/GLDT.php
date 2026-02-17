<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GLDT extends Model
{
   
    use HasFactory;
    protected $table = 'GLDT';
    protected $fillable = [];
    protected $primaryKey = 'GLID';

    public function header()
    {
        return $this->belongsTo(GLHD::class, 'GLID', 'GLID');
    }

    public function account()
    {
        return $this->belongsTo(EMAcc::class, 'AccID', 'AccID');
    }
}
