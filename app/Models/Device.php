<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $guarded = [];

    protected $casts = [
        'last_seen' => 'datetime',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function metrics()
    {
        return $this->hasMany(DeviceMetric::class);
    }

    public function logs()
    {
        return $this->hasMany(DeviceLog::class);
    }

    public function checklistLogs()
    {
        return $this->hasMany(ChecklistLog::class);
    }
}
