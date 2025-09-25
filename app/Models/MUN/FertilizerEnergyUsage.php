<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerEnergyUsage extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_energy_usages';
    protected $fillable = ['production_id', 'electricity_kwh', 'fuel_litre', 'cost','number_kwh'];

    public function production()
    {
        return $this->belongsTo(FertilizerProduction::class, 'production_id');
    }
}
