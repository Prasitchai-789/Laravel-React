<?php

namespace App\Models\QMR;

use App\Models\User;
use App\Traits\HandlesMalformedDates;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RiskRegister extends Model
{
    use HandlesMalformedDates, SoftDeletes;

    protected $table = 'qmr_risk_registers';

    protected $fillable = [
        'code',
        'document_type',
        'document_code',
        'document_name',
        'effective_date',
        'revision_no',
        'document_title',
        'issue_type',
        'consideration',
        'stakeholder',
        'expectation',
        'impact',
        'risk_category',
        'process_name',
        'owner_name',
        'owner_user_id',
        'risk_likelihood',
        'risk_impact',
        'risk_score',
        'risk_level',
        'improvement_likelihood',
        'improvement_impact',
        'improvement_score',
        'improvement_level',
        'status',
        'review_due_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'review_due_date' => 'date',
        'risk_likelihood' => 'integer',
        'risk_impact' => 'integer',
        'risk_score' => 'integer',
        'improvement_likelihood' => 'integer',
        'improvement_impact' => 'integer',
        'improvement_score' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function kpis(): HasMany
    {
        return $this->hasMany(RiskKpi::class, 'risk_register_id');
    }

    public function controls(): HasMany
    {
        return $this->hasMany(RiskControl::class, 'risk_register_id');
    }

    protected static function booted(): void
    {
        static::saving(function (RiskRegister $riskRegister): void {
            $riskRegister->risk_likelihood = self::normalizeScore($riskRegister->risk_likelihood);
            $riskRegister->risk_impact = self::normalizeScore($riskRegister->risk_impact);
            $riskRegister->improvement_likelihood = self::normalizeScore($riskRegister->improvement_likelihood);
            $riskRegister->improvement_impact = self::normalizeScore($riskRegister->improvement_impact);
            $riskRegister->calculateRiskFields();
        });

        static::deleting(function (RiskRegister $riskRegister): void {
            if ($riskRegister->isForceDeleting()) {
                $riskRegister->kpis()->withTrashed()->forceDelete();
                $riskRegister->controls()->withTrashed()->forceDelete();

                return;
            }

            $riskRegister->kpis()->delete();
            $riskRegister->controls()->delete();
        });

        static::restoring(function (RiskRegister $riskRegister): void {
            $riskRegister->kpis()->withTrashed()->restore();
            $riskRegister->controls()->withTrashed()->restore();
        });
    }

    public function calculateRiskFields(): void
    {
        $this->risk_score = $this->risk_likelihood * $this->risk_impact;
        $this->risk_level = self::levelFromScore($this->risk_score);
        $this->improvement_score = $this->improvement_likelihood * $this->improvement_impact;
        $this->improvement_level = self::levelFromScore($this->improvement_score);
    }

    public static function levelFromScore(int $score): string
    {
        return match (true) {
            $score >= 13 => 'H',
            $score >= 5 => 'M',
            default => 'L',
        };
    }

    private static function normalizeScore(mixed $score): int
    {
        return min(5, max(1, (int) $score));
    }
}
