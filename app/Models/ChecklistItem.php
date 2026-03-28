<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    public function checklist()
    {
        return $this->belongsTo(Checklist::class);
    }
}
