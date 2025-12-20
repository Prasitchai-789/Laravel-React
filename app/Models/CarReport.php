<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarReport extends Model
{
    /**
     * The connection name for the model.
     */
    protected $connection = 'sqlsrv3';

    /**
     * The table associated with the model.
     */
    protected $table = 'car_reports';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'car_date' => 'datetime',
        'car_buy' => 'datetime',
        'car_tax' => 'datetime',
        'car_insurance' => 'datetime',
    ];

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'car_number',
        'car_county',
        'car_type',
        'car_character',
        'car_brand',
        'car_model',
        'car_year',
        'car_color',
        'car_fuel',
        'car_mileage',
        'car_date',
        'car_buy',
        'car_tax',
        'car_insurance',
        'car_photo',
        'car_status',
        'car_details',
        'car_department',
        'car_card',
    ];

    /**
     * Get all usages for this car.
     */
    public function uses()
    {
        return $this->hasMany(CarUse::class, 'card_id', 'id');
    }

    /**
     * Get full car name with province.
     */
    public function getFullCarNameAttribute(): string
    {
        return $this->car_number . ' ' . ($this->province_name ?? $this->car_county);
    }
}
