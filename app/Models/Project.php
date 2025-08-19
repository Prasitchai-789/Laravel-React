<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
    ];

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function getProgressAttribute()
    {
        if ($this->tasks->count() === 0) {
            return 0;
        }
        return round($this->tasks->avg('progress'));
    }
    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
    public function files()
    {
        return $this->morphMany(File::class, 'fileable');
    }
}
