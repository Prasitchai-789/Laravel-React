<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PeoplePopulation extends Model
{
    use HasFactory;
    protected $table = 'people_populations';

    protected $fillable = [
    'national_id', 'title', 'first_name', 'last_name',
    'birthdate', 'gender', 'house_no',
    'village_no', 'village_name',
    'subdistrict_name', 'district_name', 'province_name',
    'city_id',
    'id_card_issued_at', 'id_card_expired_at',
    'religion', 'age_at_import', 'phone'
];


    public $timestamps = true;
}
