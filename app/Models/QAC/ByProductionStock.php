<?php

namespace App\Models\QAC;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ByProductionStock extends Model
{
    use HasFactory;

    protected $table = 'by_production_stocks';

    // เพิ่มฟิลด์วันที่ที่แปลงแล้ว
    protected $appends = [
        'production_date_clean',
        'production_date_th',
    ];

    protected $fillable = [
        'production_date',
        'initial_palm_quantity',
        'efb_fiber_percentage',
        'efb_percentage',
        'shell_percentage',
        'efb_fiber_produced',
        'efb_produced',
        'shell_produced',
        'efb_fiber_previous_balance',
        'efb_previous_balance',
        'shell_previous_balance',
        'efb_fiber_sold',
        'efb_sold',
        'shell_sold',
        'efb_fiber_other',
        'efb_other',
        'shell_other',
        'efb_fiber_balance',
        'efb_balance',
        'shell_balance',
        'notes'
    ];

    // ❗ สำคัญ: ห้าม cast เป็น date เพราะฟอร์แมตผิด
    protected $casts = [
        'initial_palm_quantity' => 'decimal:2',
        'efb_fiber_percentage' => 'decimal:2',
        'efb_percentage' => 'decimal:2',
        'shell_percentage' => 'decimal:2',
        'efb_fiber_produced' => 'decimal:2',
        'efb_produced' => 'decimal:2',
        'shell_produced' => 'decimal:2',
        'efb_fiber_previous_balance' => 'decimal:2',
        'efb_previous_balance' => 'decimal:2',
        'shell_previous_balance' => 'decimal:2',
        'efb_fiber_sold' => 'decimal:2',
        'efb_sold' => 'decimal:2',
        'shell_sold' => 'decimal:2',
        'efb_fiber_other' => 'decimal:2',
        'efb_other' => 'decimal:2',
        'shell_other' => 'decimal:2',
        'efb_fiber_balance' => 'decimal:2',
        'efb_balance' => 'decimal:2',
        'shell_balance' => 'decimal:2',
    ];

    /**
     * วันที่แบบแก้ไขแล้ว (ใช้ใน React)
     * เช่น "2025-11-13"
     */
    public function getProductionDateCleanAttribute()
    {
        // ต้องใช้ getOriginal เพื่อไม่ให้ cast ทำงาน
        $raw = $this->getOriginal('production_date');

        if (!$raw) {
            return null;
        }

        // แก้รูปแบบ :AM → AM
        $clean = str_replace([':AM', ':PM'], [' AM', ' PM'], $raw);

        try {
            return Carbon::createFromFormat('M d Y h:i:s A', $clean)
                ->format('Y-m-d');
        } catch (\Exception $e) {
            return $raw; // กันตาย ไม่ให้ API 500
        }
    }

    /**
     * วันที่แบบไทย เช่น "13 พ.ย. 2568"
     */
    public function getProductionDateThAttribute()
    {
        $clean = $this->production_date_clean;

        if (!$clean) return null;

        try {
            return Carbon::parse($clean)
                ->locale('th')
                ->translatedFormat('j M Y');
        } catch (\Exception $e) {
            return $clean;
        }
    }

    // คำนวณปริมาณที่ผลิตได้
    public function calculateProducedQuantities()
    {
        $this->efb_fiber_produced = ($this->initial_palm_quantity * $this->efb_fiber_percentage) / 100;
        $this->efb_produced = ($this->initial_palm_quantity * $this->efb_percentage) / 100;
        $this->shell_produced = ($this->initial_palm_quantity * $this->shell_percentage) / 100;
    }

    // คำนวณยอดคงเหลือ
    public function calculateBalances()
    {
        $this->efb_fiber_balance =
            $this->efb_fiber_previous_balance +
            $this->efb_fiber_produced -
            $this->efb_fiber_sold -
            $this->efb_fiber_other;

        $this->efb_balance =
            $this->efb_previous_balance +
            $this->efb_produced -
            $this->efb_sold -
            $this->efb_other;

        $this->shell_balance =
            $this->shell_previous_balance +
            $this->shell_produced -
            $this->shell_sold -
            $this->shell_other;
    }
}
