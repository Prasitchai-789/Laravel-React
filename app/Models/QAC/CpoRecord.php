<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CpoRecord extends Model
{
    use HasFactory;

    protected $fillable = ['record_date'];

    public function tanks()
    {
        return $this->hasMany(CpoTank::class);
    }

    public function oilRoom()
    {
        return $this->hasOne(CpoOilRoom::class);
    }
}
