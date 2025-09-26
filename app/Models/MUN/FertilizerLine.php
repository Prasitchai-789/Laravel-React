<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerLine extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_lines';
    protected $fillable = ['name', 'location'];

    public function productions()
    {
        return $this->hasMany(FertilizerProduction::class, 'line_id');
    }

    public function machines()
    {
        return $this->hasMany(FertilizerMachine::class, 'line_id');
    }
}
