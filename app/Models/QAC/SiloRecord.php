<?php

namespace App\Models\QAC;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SiloRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'record_date',
        'is_production',
        'nut_silo_1_level',
        'nut_silo_2_level',
        'nut_silo_3_level',
        'kernel_silo_1_level',
        'kernel_silo_2_level',
        'silo_sale_big_level',
        'silo_sale_small_level',
        'kernel_outside_pile',
        'moisture_percent',
        'shell_percent',
        'outside_nut',
    ];

    protected $casts = [
        'is_production' => 'boolean',
    ];

    // ค่าคงที่สำหรับการคำนวณ
    const CONSTANTS = [
        'nut_silo_1' => 614,
        'nut_silo_2' => 614,
        'nut_silo_3' => 614,
        'kernel_silo_1' => 640,
        'kernel_silo_2' => 640,
        'silo_sale_big' => 920,
        'silo_sale_small' => 870,
    ];

    // ค่าคูณสำหรับแต่ละ Silo
    const MULTIPLIERS = [
        'nut_silo_1' => 0.0453,
        'nut_silo_2' => 0.0453,
        'nut_silo_3' => 0.0538,
        'kernel_silo_1' => 0.0296,
        'kernel_silo_2' => 0.0296,
        'silo_sale_big' => 0.228,
        'silo_sale_small' => 0.228,
    ];

    // Accessors สำหรับคำนวณปริมาณจริง (ทศนิยม 3 ตำแหน่ง)
    public function getNutSilo1QuantityAttribute()
    {
        return round((self::CONSTANTS['nut_silo_1'] - $this->nut_silo_1_level) * self::MULTIPLIERS['nut_silo_1'], 3);
    }

    public function getNutSilo2QuantityAttribute()
    {
        return round((self::CONSTANTS['nut_silo_2'] - $this->nut_silo_2_level) * self::MULTIPLIERS['nut_silo_2'], 3);
    }

    public function getNutSilo3QuantityAttribute()
    {
        return round(((self::CONSTANTS['nut_silo_3'] - $this->nut_silo_3_level) * self::MULTIPLIERS['nut_silo_3']) + 2.19, 3);
    }

    public function getKernelSilo1QuantityAttribute()
    {
        return round((self::CONSTANTS['kernel_silo_1'] - $this->kernel_silo_1_level) * self::MULTIPLIERS['kernel_silo_1'], 3);
    }

    public function getKernelSilo2QuantityAttribute()
    {
        return round((self::CONSTANTS['kernel_silo_2'] - $this->kernel_silo_2_level) * self::MULTIPLIERS['kernel_silo_2'], 3);
    }

    public function getSiloSaleBigQuantityAttribute()
    {
        return round((self::CONSTANTS['silo_sale_big'] - $this->silo_sale_big_level) * self::MULTIPLIERS['silo_sale_big'], 3);
    }

    public function getSiloSaleSmallQuantityAttribute()
    {
        return round((self::CONSTANTS['silo_sale_small'] - $this->silo_sale_small_level) * self::MULTIPLIERS['silo_sale_small'], 3);
    }
}
