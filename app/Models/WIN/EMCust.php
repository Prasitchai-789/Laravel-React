<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EMCust extends Model
{
    
    use HasFactory;
    protected $table = 'EMCust';
    protected $primaryKey = 'CustID';
    public $timestamps = false;
    protected $fillable = ['AccID', 'CustCode', 'CustTitle', 'CustName'];

    public function invoices()
    {
        return $this->hasMany(SOInvHD::class, 'CustID', 'CustID');
    }

    public function purchaseHeaders()
    {
        return $this->hasMany(POInvHD::class, 'VendorID', 'CustID');
    }
}
