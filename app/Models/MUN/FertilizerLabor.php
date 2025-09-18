<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerLabor extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_labors';
    protected $fillable = ['production_id', 'workers', 'hours', 'ot_hours', 'labor_cost'];

    public function production()
    {
        return $this->belongsTo(FertilizerProduction::class, 'production_id');
    }
}
