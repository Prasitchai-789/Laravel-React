<?php

namespace App\Models\WIN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SOInvHD extends Model
{
    protected $connection = 'sqlsrv2';
    use HasFactory;
    protected $table = 'SOInvHD';
    protected $primaryKey = 'SOInvID';
    public $timestamps = false;

    protected $fillable = ['DocuDate', 'CustID'];

    public function details()
    {
        return $this->hasMany(SOInvDT::class, 'SOInvID', 'SOInvID');
    }

    public function customer()
    {
        return $this->belongsTo(EMCust::class, 'CustID', 'CustID');
    }
}
