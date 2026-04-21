<?php

namespace App\Models\Computer;

use Illuminate\Database\Eloquent\Model;

class ComputerInspectionPlan extends Model
{
    protected $fillable = [
        'computer_id',
        'month',
        'year',
        'status',
        'planned_by'
    ];

    protected $casts = [
        'computer_id' => 'integer',
        'month' => 'integer',
        'year' => 'integer',
    ];

    public function computer()
    {
        return $this->belongsTo(Computer::class, 'computer_id', 'id');
    }
}
