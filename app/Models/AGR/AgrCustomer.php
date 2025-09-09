<?php

namespace App\Models\AGR;

use App\Models\WIN\WebCity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AgrCustomer extends Model
{
    use HasFactory;

    protected $table = 'agr_customers';

    protected $fillable = [
        'name',
        'address',
        'subdistrict',
        'district',
        'province',
        'phone',
        'notes',
        'id_card',
    ];

     public function cityProvince()
    {
        return $this->belongsTo(WebCity::class, 'province', 'ProvinceID');
    }

    // ความสัมพันธ์กับ WebCity สำหรับอำเภอ
    public function cityDistrict()
    {
        return $this->belongsTo(WebCity::class, 'district', 'DistrictID');
    }

    // ความสัมพันธ์กับ WebCity สำหรับตำบล
    public function citySubdistrict()
    {
        return $this->belongsTo(WebCity::class, 'subdistrict', 'SubDistrictID');
    }

    public function city()
    {
        return $this->belongsTo(WebCity::class, 'province', 'ProvinceID');
    }
}
