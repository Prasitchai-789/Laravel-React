<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceMetric extends Model
{
    protected $guarded = [];
    public $timestamps = true;
    
    const UPDATED_AT = null;
    
    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
