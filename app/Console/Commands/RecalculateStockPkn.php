<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\QAC\SiloRecord;
use App\Models\QAC\StockProduct;
use Illuminate\Support\Facades\DB;

class RecalculateStockPkn extends Command
{
    protected $signature = 'stock:recalculate-pkn {--dry-run : Show changes without updating}';
    protected $description = 'คำนวณ stock_products.pkn ใหม่สำหรับ production records ทั้งหมด (แก้ไขสูตรเก่าที่ไม่ได้ clamp ค่าลบ)';

    // ค่าคงที่เหมือนในโมเดล SiloRecord
    const CONSTANTS = [
        'silo_sale_big'   => 920,
        'silo_sale_small' => 870,
    ];

    const MULTIPLIERS = [
        'silo_sale_big'   => 0.228,
        'silo_sale_small' => 0.228,
    ];

    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        $this->info($isDryRun ? '=== DRY RUN MODE ===' : '=== UPDATING stock_products.pkn ===');
        $this->newLine();

        // ใช้ raw SQL join เพื่อเทียบวันที่ได้ถูกต้อง (SQL Server datetime format)
        $data = DB::select("
            SELECT
                sr.id as silo_id,
                sr.record_date,
                sr.silo_sale_big_level,
                sr.silo_sale_small_level,
                sp.id as stock_id,
                sp.pkn as old_pkn
            FROM silo_records sr
            INNER JOIN stock_products sp
                ON CAST(sr.record_date AS DATE) = CAST(sp.record_date AS DATE)
            WHERE sr.is_production = 1
            ORDER BY sr.record_date ASC
        ");

        $this->info("พบ production records ที่มี stock_products: " . count($data) . " รายการ");
        $this->newLine();

        $headers = ['Date', 'bigLvl', 'smLvl', 'Old PKN', 'New PKN', 'Diff', 'Status'];
        $rows = [];
        $updated = 0;
        $skipped = 0;

        foreach ($data as $d) {
            $bigLvl = floatval($d->silo_sale_big_level);
            $smLvl  = floatval($d->silo_sale_small_level);

            // คำนวณด้วยสูตรใหม่ (อนุญาตค่าลบ)
            $rawBig = (self::CONSTANTS['silo_sale_big'] - $bigLvl) * self::MULTIPLIERS['silo_sale_big'];
            $big = $rawBig;

            $rawSm = (self::CONSTANTS['silo_sale_small'] - $smLvl) * self::MULTIPLIERS['silo_sale_small'];
            $small = $rawSm;

            $sum = $big + $small;
            $newPkn = round(($sum / 2) + 12, 3);
            $oldPkn = floatval($d->old_pkn);
            $diff = round($newPkn - $oldPkn, 3);

            // แปลง SQL Server date format สำหรับแสดงผล
            $cleanDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $d->record_date);
            $displayDate = date('Y-m-d', strtotime($cleanDate));

            if (abs($diff) < 0.001) {
                $skipped++;
                $status = 'OK';
            } else {
                $status = $isDryRun ? 'WILL UPDATE' : 'UPDATED';
                $updated++;

                if (!$isDryRun) {
                    DB::table('stock_products')
                        ->where('id', $d->stock_id)
                        ->update(['pkn' => $newPkn]);
                }
            }

            $rows[] = [
                $displayDate,
                $bigLvl,
                $smLvl,
                $oldPkn,
                $newPkn,
                $diff,
                $status,
            ];
        }

        $this->table($headers, $rows);
        $this->newLine();
        $this->info("สรุป:");
        $this->info("  - อัพเดท: {$updated} รายการ");
        $this->info("  - ตรงแล้ว: {$skipped} รายการ");

        if ($isDryRun && $updated > 0) {
            $this->newLine();
            $this->warn("นี่เป็น dry run — ยังไม่ได้อัพเดทจริง");
            $this->warn("รัน 'php artisan stock:recalculate-pkn' (ไม่ใส่ --dry-run) เพื่ออัพเดทจริง");
        }

        return Command::SUCCESS;
    }
}
