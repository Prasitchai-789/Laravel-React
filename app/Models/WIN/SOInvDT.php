<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SOInvDT extends Model
{
    use HasFactory;
    protected $table = 'SOInvDT';
    protected $primaryKey = 'SOInvDTID';
    public $timestamps = false;

    protected $fillable = ['SOInvID', 'GoodID', 'GoodUnitID2', 'Docutype',  'GoodName', 'GoodQty2', 'GoodPrice2', 'GoodAmnt', 'RefeNo'];

    // 📌 รายการนี้อยู่ใน Invoice ไหน
    public function invoice()
    {
        return $this->belongsTo(SOInvHD::class, 'SOInvID', 'SOInvID');
    }

    // 📌 รายการนี้เป็นสินค้าตัวไหน
    public function good()
    {
        return $this->belongsTo(EMGood::class, 'GoodID', 'GoodID');
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
    // ใน SOInvHD model
public function customer()
{
    return $this->belongsTo(EMCust::class, 'CustID', 'CustID');
}

public function details()
{
    return $this->hasMany(SOInvDT::class, 'SOInvID', 'SOInvID');
}
}
