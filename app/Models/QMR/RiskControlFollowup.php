<?php

namespace App\Models\QMR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskControlFollowup extends Model
{
    protected $table = 'qmr_risk_control_followups';

    protected $fillable = [
        'risk_control_id',
        'followup_date',
        'progress_percent',
        'status',
        'result',
        'followed_by',
    ];

    protected $casts = [
        'followup_date' => 'date',
        'progress_percent' => 'integer',
    ];

    public function control(): BelongsTo
    {
        return $this->belongsTo(RiskControl::class, 'risk_control_id');
    }

    public function follower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'followed_by');
    }
}
