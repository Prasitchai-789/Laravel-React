<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Checkpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'area',
        'latitude',
        'longitude',
        'radius_meters',
        'is_active',
        'description',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'radius_meters' => 'integer',
        'is_active' => 'boolean',
    ];

    public function patrolLogs(): HasMany
    {
        return $this->hasMany(GuardPatrolLog::class);
    }
}
