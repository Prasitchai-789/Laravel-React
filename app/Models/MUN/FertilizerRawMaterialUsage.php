<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerRawMaterialUsage extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_raw_material_usages';
    protected $fillable = ['production_id', 'material_id', 'qty_used', 'unit_cost', 'total_cost'];

    public function production()
    {
        return $this->belongsTo(FertilizerProduction::class, 'production_id');
    }

    public function material()
    {
        return $this->belongsTo(FertilizerMaterial::class, 'material_id');
    }
}
