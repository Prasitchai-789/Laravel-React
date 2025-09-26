<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerSupplier extends Model
{
     use HasFactory;

    protected $table = 'fertilizer_suppliers';
    protected $fillable = ['name', 'contact_info'];

    public function materials()
    {
        return $this->hasMany(FertilizerMaterial::class, 'supplier_id');
    }
}
