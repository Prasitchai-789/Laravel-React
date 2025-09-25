<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerProduction extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_productions';
    protected $fillable = ['date', 'shift', 'line_id', 'product_qty', 'target_qty'];

    public function line()
    {
        return $this->belongsTo(FertilizerLine::class, 'line_id');
    }

    public function rawMaterialUsages()
    {
        return $this->hasMany(FertilizerRawMaterialUsage::class, 'production_id');
    }

    public function energyUsage()
    {
        return $this->hasOne(FertilizerEnergyUsage::class, 'production_id');
    }

    public function labors()
    {
        return $this->hasMany(FertilizerLabor::class, 'production_id', 'id');
    }

    public function machineDowntimes()
    {
        return $this->hasMany(FertilizerMachineDowntime::class, 'production_id');
    }

    public function issues()
    {
        return $this->hasMany(FertilizerIssue::class, 'production_id');
    }
}
