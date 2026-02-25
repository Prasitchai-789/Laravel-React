<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * ใช้ connection sqlsrv2 (ฐานข้อมูลภายนอก)
     */
    protected $connection = 'sqlsrv2';

    public function up(): void
    {
        // ตรวจสอบว่ามีคอลัมน์ deleted_at อยู่แล้วหรือยัง
        $exists = DB::connection('sqlsrv2')
            ->select("
                SELECT COUNT(*) as cnt
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'SOPlan'
                  AND COLUMN_NAME = 'deleted_at'
            ");

        if ($exists[0]->cnt == 0) {
            DB::connection('sqlsrv2')->statement(
                'ALTER TABLE [SOPlan] ADD [deleted_at] DATETIME NULL'
            );
        }
    }

    public function down(): void
    {
        $exists = DB::connection('sqlsrv2')
            ->select("
                SELECT COUNT(*) as cnt
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'SOPlan'
                  AND COLUMN_NAME = 'deleted_at'
            ");

        if ($exists[0]->cnt > 0) {
            DB::connection('sqlsrv2')->statement(
                'ALTER TABLE [SOPlan] DROP COLUMN [deleted_at]'
            );
        }
    }
};
