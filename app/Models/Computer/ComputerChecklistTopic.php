<?php

namespace App\Models\Computer;

use Illuminate\Database\Eloquent\Model;

class ComputerChecklistTopic extends Model
{
    protected $fillable = ['title', 'is_active', 'order'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
