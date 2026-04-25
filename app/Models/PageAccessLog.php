<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageAccessLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'method',
        'path',
        'route_name',
        'ip_address',
        'user_agent',
        'referer',
        'status_code',
        'accessed_at',
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
