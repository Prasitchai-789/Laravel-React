<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class POInvDT extends Model
{
    
    use HasFactory;
    protected $table = 'POInvDT';
    protected $primaryKey = 'POInvID';
    protected $fillable = [];
    public function poHD()
    {
        return $this->belongsTo(POInvHD::class, 'POInvID', 'POInvID');
    }

    public function good()
    {
        return $this->belongsTo(EMGood::class, 'GoodID', 'GoodID');
    }

}
