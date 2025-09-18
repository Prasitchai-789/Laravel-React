<?php

namespace App\Models\MUN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FertilizerMachineDowntime extends Model
{
    use HasFactory;

    protected $table = 'fertilizer_machine_downtimes';
    protected $fillable = ['machine_id', 'production_id', 'reason', 'duration', 'cost'];

    public function machine()
    {
        return $this->belongsTo(FertilizerMachine::class, 'machine_id');
    }

    public function production()
    {
        return $this->belongsTo(FertilizerProduction::class, 'production_id');
    }
}
