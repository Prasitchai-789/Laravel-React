<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardPatrolLog extends Model
{
    use HasFactory;

    public const STATUS_OK = 'ok';
    public const STATUS_OUT_OF_RADIUS = 'out_of_radius';
    public const STATUS_INVALID_CHECKPOINT = 'invalid_checkpoint';
    public const STATUS_INACTIVE_CHECKPOINT = 'inactive_checkpoint';

    protected $fillable = [
        'checkpoint_id',
        'guard_id',
        'guard_name',
        'checkpoint_code',
        'scan_latitude',
        'scan_longitude',
        'checkpoint_latitude',
        'checkpoint_longitude',
        'allowed_radius_meters',
        'distance_meters',
        'is_within_radius',
        'status',
        'note',
        'ip_address',
        'user_agent',
        'checked_at',
        'telegram_sent',
        'telegram_sent_at',
    ];

    protected $casts = [
        'scan_latitude' => 'float',
        'scan_longitude' => 'float',
        'checkpoint_latitude' => 'float',
        'checkpoint_longitude' => 'float',
        'allowed_radius_meters' => 'integer',
        'distance_meters' => 'float',
        'is_within_radius' => 'boolean',
        'checked_at' => 'datetime',
        'telegram_sent' => 'boolean',
        'telegram_sent_at' => 'datetime',
    ];

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(Checkpoint::class);
    }

    public function securityGuard(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guard_id');
    }
}
