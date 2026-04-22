<?php

namespace App\Models\Computer;

use Illuminate\Database\Eloquent\Model;

use Carbon\Carbon;

class ComputerInspection extends Model
{
    protected $fillable = [
        'computer_id', 'inspection_date', 'data', 'remark', 'image_paths', 'checked_by'
    ];

    protected $casts = [
        'data' => 'array',
        'image_paths' => 'array',
        'inspection_date' => 'date',
        'computer_id' => 'integer',
    ];

    /**
     * Override to handle unconventional date formats returned by some SQL Server configurations
     */
    protected function asDateTime($value)
    {
        try {
            return parent::asDateTime($value);
        } catch (\Exception $e) {
            if (is_string($value)) {
                try {
                    return Carbon::createFromFormat('M d Y H:i:s:A', $value);
                } catch (\Exception $ex) {
                    // Fallback to original failure if even this doesn't work
                }
            }
            throw $e;
        }
    }

    public function computer()
    {
        return $this->belongsTo(Computer::class, 'computer_id', 'id');
    }
}
