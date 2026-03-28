<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistLog extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function item()
    {
        return $this->belongsTo(ChecklistItem::class, 'checklist_item_id');
    }
}
