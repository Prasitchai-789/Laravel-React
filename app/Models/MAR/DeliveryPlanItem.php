<?php

namespace App\Models\MAR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryPlanItem extends Model
{
    /**
     * The connection name for the model.
     *
     * @var string
     */
    protected $connection = 'sqlsrv';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'delivery_plan_items';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'plan_date',
        'quantity',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // Remove plan_date cast to avoid Carbon parsing crash on SQLSRV weird date shapes
    ];

    /**
     * Parse SQL Server weird date strings gracefully.
     */
    public function getPlanDateAttribute($value)
    {
        if (!$value) return null;
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            $clean = str_replace([':AM', ':PM'], [' AM', ' PM'], $value);
            try {
                return \Carbon\Carbon::parse($clean)->format('Y-m-d');
            } catch (\Exception $e2) {
                return $value; // Fallback
            }
        }
    }

    /**
     * Get the order that owns the plan item.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }
}
