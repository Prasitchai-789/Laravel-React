<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetInformation extends Model
{
    protected $table = 'asset_information'; // ชื่อตารางตรงกับ DB
    protected $primaryKey = 'id';           // ชื่อ PK
    public $timestamps = true;              // ถ้ามี created_at / updated_at

    protected $fillable = [
        'asset_name', 'requester', 'department', 'location', 'purpose',
        'assignee', 'assign_date', 'note', 'last_maintenance', 'next_maintenance',
        'quantity', 'unit', 'model'
    ];

    // ความสัมพันธ์กับ Computer (optional)
    public function computer()
    {
        return $this->hasOne(WebappComputer::class, 'code_com', 'asset_name');
    }
}
