<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Citizen extends Model
{
    protected $fillable = [
        'citizen_id', 'title', 'first_name', 'last_name', 'birth_date',
        'gender', 'phone', 'village_name', 'house_no', 'moo', 'alley',
        'soi', 'road', 'subdistrict', 'district', 'province',
        'card_issue_date', 'card_expire_date', 'religion', 'age', 'photo'
    ];
}

