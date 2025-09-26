<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerMaterial extends Model
{
     use HasFactory;

    protected $table = 'fertilizer_materials';
    protected $fillable = ['name', 'unit', 'supplier_id'];

    public function supplier()
    {
        return $this->belongsTo(FertilizerSupplier::class, 'supplier_id');
    }

    public function usages()
    {
        return $this->hasMany(FertilizerRawMaterialUsage::class, 'material_id');
    }
}
