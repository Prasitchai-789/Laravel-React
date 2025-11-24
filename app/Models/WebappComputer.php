<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebappComputer extends Model
{
    protected $table = 'Webapp_computers';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'code_com', 'cpu', 'ram', 'storage', 'os', 'status', 'office'
    ];

    // ความสัมพันธ์ย้อนกลับไป Asset
    public function asset()
    {
        return $this->belongsTo(AssetInformation::class, 'code_com', 'asset_name');
    }
}
