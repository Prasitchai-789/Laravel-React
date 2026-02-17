<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EMVendor extends Model
{
    
    use HasFactory;
    protected $table = 'EMVendor';
    protected $primaryKey = 'VendorID';
    protected $fillable =[

    ];
    public function poHDs()
    {
        return $this->hasMany(POInvHD::class, 'VendorID', 'VendorID');
    }
}
