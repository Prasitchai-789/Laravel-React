<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GLHD extends Model
{
    
    use HasFactory;
    protected $table = 'GLHD';
    protected $fillable =[

    ];
    protected $primaryKey = 'GLID';

   
    public function details()
    {
        return $this->hasMany(GLDT::class, 'GLID', 'GLID');
    }

}
