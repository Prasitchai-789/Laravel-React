<?php

namespace App\Models\QMR;

use App\Models\User;
use App\Traits\HandlesMalformedDates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RiskKpi extends Model
{
    use HandlesMalformedDates, SoftDeletes;

    protected $table = 'qmr_risk_kpis';

    protected $fillable = [
        'risk_register_id',
        'code',
        'name',
        'threshold',
        'unit',
        'direction',
        'target_value',
        'warning_value',
        'critical_value',
        'green_criteria',
        'yellow_criteria',
        'red_criteria',
        'current_value',
        'target_percent',
        'status',
        'measured_at',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'target_value' => 'decimal:4',
        'warning_value' => 'decimal:4',
        'critical_value' => 'decimal:4',
        'current_value' => 'decimal:4',
        'target_percent' => 'decimal:2',
        'measured_at' => 'date',
    ];

    public function riskRegister(): BelongsTo
    {
        return $this->belongsTo(RiskRegister::class, 'risk_register_id');
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(RiskKpiMeasurement::class, 'risk_kpi_id');
    }

    public function controls(): HasMany
    {
        return $this->hasMany(RiskControl::class, 'risk_kpi_id');
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
        static::deleting(function (RiskKpi $riskKpi): void {
            $riskKpi->measurements()->delete();
            $riskKpi->controls()->update(['risk_kpi_id' => null]);
        });
    }
}
