<?php

namespace App\Models\QMR;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskKpiMeasurement extends Model
{
    protected $table = 'qmr_risk_kpi_measurements';

    protected $fillable = [
        'risk_kpi_id',
        'measured_date',
        'value',
        'target_percent',
        'status',
        'note',
        'created_by',
    ];

    protected $casts = [
        'measured_date' => 'date',
        'value' => 'decimal:4',
        'target_percent' => 'decimal:2',
    ];

    public function kpi(): BelongsTo
    {
        return $this->belongsTo(RiskKpi::class, 'risk_kpi_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
