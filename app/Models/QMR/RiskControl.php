<?php

namespace App\Models\QMR;

use App\Models\User;
use App\Traits\HandlesMalformedDates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RiskControl extends Model
{
    use HandlesMalformedDates, SoftDeletes;

    protected $table = 'qmr_risk_controls';

    protected $fillable = [
        'risk_register_id',
        'risk_kpi_id',
        'code',
        'name',
        'description',
        'status',
        'progress_percent',
        'responsible_name',
        'responsible_user_id',
        'start_date',
        'due_date',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'progress_percent' => 'integer',
        'start_date' => 'date',
        'due_date' => 'date',
    ];

    public function riskRegister(): BelongsTo
    {
        return $this->belongsTo(RiskRegister::class, 'risk_register_id');
    }

    public function kpi(): BelongsTo
    {
        return $this->belongsTo(RiskKpi::class, 'risk_kpi_id');
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function followups(): HasMany
    {
        return $this->hasMany(RiskControlFollowup::class, 'risk_control_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected static function booted(): void
    {
        static::deleting(function (RiskControl $riskControl): void {
            $riskControl->followups()->delete();
        });
    }
}
