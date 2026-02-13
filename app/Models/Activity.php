<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'activity_date',
        'location',
        'status',
        'created_by',
    ];

    protected $casts = [
        'activity_date' => 'date',
    ];

    /**
     * Get the images for this activity
     */
    public function images(): HasMany
    {
        return $this->hasMany(ActivityImage::class, 'activity_id');
    }

    /**
     * Get the user who created this activity
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
