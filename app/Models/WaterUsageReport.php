<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaterUsageReport extends Model
{
    protected $fillable = [
        'report_date',
        'wastewater_meter_before',
        'wastewater_meter_after',
        'wastewater_volume',
        'water_treatment_meter_before',
        'water_treatment_meter_after',
        'water_treatment_volume',
        'raw_water_volume',
        'sludge_weight_kg',
        'em_usage_liter',
        'molasses_usage_liter',
        'note',
        'user_id',
    ];

    protected $casts = [
        'wastewater_meter_before' => 'decimal:2',
        'wastewater_meter_after' => 'decimal:2',
        'wastewater_volume' => 'decimal:2',
        'water_treatment_meter_before' => 'decimal:2',
        'water_treatment_meter_after' => 'decimal:2',
        'water_treatment_volume' => 'decimal:2',
        'raw_water_volume' => 'decimal:2',
        'sludge_weight_kg' => 'decimal:2',
        'em_usage_liter' => 'decimal:2',
        'molasses_usage_liter' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
