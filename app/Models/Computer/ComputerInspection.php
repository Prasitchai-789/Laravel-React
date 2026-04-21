<?php

namespace App\Models\Computer;

use Illuminate\Database\Eloquent\Model;

class ComputerInspection extends Model
{
    protected $fillable = [
        'computer_id', 'inspection_date', 'data', 'remark', 'image_paths', 'checked_by'
    ];

    protected $casts = [
        'data' => 'array',
        'image_paths' => 'array',
        'inspection_date' => 'date',
    ];

    public function computer()
    {
        return $this->belongsTo(Computer::class, 'computer_id', 'id');
    }
}
