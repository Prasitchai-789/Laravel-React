<?php

namespace App\Models\CCTV;

use Illuminate\Database\Eloquent\Model;

class CctvInspection extends Model
{
    protected $table = 'cctv_inspections';
    protected $fillable = [
        'dvr_id', 'inspection_date', 'camera_data', 'dvr_remark', 'image_path', 'image_paths', 'checked_by',
    ];

    protected $casts = [
        'camera_data' => 'array',
        'image_paths' => 'array',
    ];

    public function dvr()
    {
        return $this->belongsTo(Dvr::class, 'dvr_id');
    }
}
