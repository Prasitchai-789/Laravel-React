<?php

namespace App\Models\CCTV;

use Illuminate\Database\Eloquent\Model;

class Dvr extends Model
{
    protected $table = 'dvrs';
    protected $fillable = ['name', 'camera_count'];

    public function inspections()
    {
        return $this->hasMany(CctvInspection::class, 'dvr_id');
    }
}
