<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PODT extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'PODT';
    protected $primaryKey = 'POID';
    public $timestamps = false;
    protected $fillable = [
        'POID', 'ListNo', 'GoodID', 'GoodName', 'GoodQty2', 'GoodPrice2', 'GoodAmnt', 'DocuType', 'RefPOID'
    ];

    public function header()
    {
        return $this->belongsTo(POHD::class, 'POID', 'POID');
    }
    public function good()
    {
        return $this->belongsTo(EMGood::class, 'GoodID', 'GoodID');
    }
}
