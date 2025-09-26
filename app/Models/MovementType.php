<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MovementType extends Model
{
    use HasFactory;

    protected $table = 'movement_type';
    protected $primaryKey = 'movement_type_id';
    protected $fillable = ['movement_type_name', 'description'];

    public function stockMovements()
    {
        return $this->hasMany(\App\Models\EMGoodStockMovement::class, 'movement_type_id', 'movement_type_id');
    }
}
