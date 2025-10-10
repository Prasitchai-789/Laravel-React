<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class POInvHD extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'POInvHD';
    protected $primaryKey = 'POInvID';
    protected $fillable =[

    ];
    public $incrementing = false;
    public $timestamps = false;
    public function details()
    {
        return $this->hasMany(POInvDT::class, 'POInvID', 'POInvID');
    }

    public function vendor()
    {
        return $this->belongsTo(EMVendor::class, 'VendorID', 'VendorID');
    }

    public function glHeader()
    {
        // DocuNo ของ POInvHD → DocuNo ของ GLHD
        return $this->hasOne(GLHD::class, 'DocuNo', 'DocuNo');
    }

}
