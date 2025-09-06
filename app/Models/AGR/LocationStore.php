<?php

namespace App\Models\AGR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LocationStore extends Model
{
    use HasFactory;

     protected $table = 'location_stores'; 
    protected $fillable = [
        'location_name',
        'note',
    ];

}
