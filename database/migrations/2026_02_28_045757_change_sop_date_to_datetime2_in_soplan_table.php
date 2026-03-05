<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ใช้ connection sqlsrv2 (ฐานข้อมูลภายนอก)
        Illuminate\Support\Facades\DB::connection('sqlsrv2')->transaction(function () {
            // 1. เปลี่ยนชื่อ SOPDate เดิมเป็น SOPDate_old
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("EXEC sp_rename 'SOPlan.SOPDate', 'SOPDate_old', 'COLUMN'");

            // 2. เพิ่มคอลัมน์ SOPDate ใหม่เป็น datetime2
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("ALTER TABLE SOPlan ADD SOPDate DATETIME2 NULL");

            // 3. แปลงข้อมูลจาก SOPDate_old ไปยัง SOPDate (ใช้ style 103 สำหรับ dd/mm/yyyy)
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("
                UPDATE SOPlan 
                SET SOPDate = TRY_CONVERT(DATETIME2, SOPDate_old, 103)
                WHERE SOPDate_old IS NOT NULL
            ");

            // 4. ลบคอลัมน์ SOPDate_old ออก
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("ALTER TABLE SOPlan DROP COLUMN SOPDate_old");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Illuminate\Support\Facades\DB::connection('sqlsrv2')->transaction(function () {
            // 1. เปลี่ยนชื่อ SOPDate (datetime2) เป็น SOPDate_temp
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("EXEC sp_rename 'SOPlan.SOPDate', 'SOPDate_temp', 'COLUMN'");

            // 2. เพิ่มคอลัมน์ SOPDate กลับเป็น nvarchar(max)
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("ALTER TABLE SOPlan ADD SOPDate NVARCHAR(MAX) NULL");

            // 3. แปลงข้อมูลกลับเป็น string
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("
                UPDATE SOPlan 
                SET SOPDate = FORMAT(TRY_CAST(SOPDate_temp AS DATETIME2), 'dd/MM/yyyy HH:mm:ss')
                WHERE SOPDate_temp IS NOT NULL
            ");

            // 4. ลบคอลัมน์ SOPDate_temp ออก
            Illuminate\Support\Facades\DB::connection('sqlsrv2')->statement("ALTER TABLE SOPlan DROP COLUMN SOPDate_temp");
        });
    }
};
