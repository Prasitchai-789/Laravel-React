<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SOInvDT extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'SOInvDT';
    protected $primaryKey = 'SOInvDTID';
    public $timestamps = false;

    protected $fillable = ['SOInvID', 'GoodID', 'GoodUnitID2', 'Docutype', 'GoodPrice2', 'GoodQty2', 'GoodAmnt'];

    public function invoice()
    {
        return $this->belongsTo(SOInvHD::class, 'SOInvID', 'SOInvID');
    }

    public function product()
    {
        return $this->belongsTo(EMGood::class, 'GoodID', 'GoodID');
    }

    public function unit()
    {
        return $this->belongsTo(EMGoodUnit::class, 'GoodUnitID2', 'GoodUnitID');
    }

    public function docuType()
    {
        return $this->belongsTo(ICDocuTypeDT::class, 'Docutype', 'DocuType');
    }
}
