<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerMachine extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_machines';
    protected $fillable = ['name', 'line_id', 'depreciation_rate'];

    public function line()
    {
        return $this->belongsTo(FertilizerLine::class, 'line_id');
    }

    public function downtimes()
    {
        return $this->hasMany(FertilizerMachineDowntime::class, 'machine_id');
    }
}
