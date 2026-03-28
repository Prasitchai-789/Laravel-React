<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Checklist extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    public function items()
    {
        return $this->hasMany(ChecklistItem::class);
    }
}
