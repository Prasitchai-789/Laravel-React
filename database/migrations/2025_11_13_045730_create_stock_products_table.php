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
        Schema::create('stock_products', function (Blueprint $table) {
            $table->id();

            $table->date('record_date')->unique()->comment('วันที่บันทึกข้อมูล');

            // ข้อมูลสินค้าหลัก
            $table->decimal('cpo', 10, 3)->default(0)->comment('น้ำมันปาล์มดิบ (ตัน)');
            $table->decimal('pkn', 10, 3)->default(0)->comment('ปาล์มเคอร์เนล (ตัน)');
            $table->decimal('pkn_out', 10, 3)->default(0)->comment('ปาล์มเคอร์เนลนอก (ตัน)');

            // ข้อมูล EFB
            $table->decimal('efb_fiber', 10, 3)->default(0)->comment('EFB Fiber (ตัน)');
            $table->decimal('efb', 10, 3)->default(0)->comment('EFB (ตัน)');

            // ข้อมูลเปลือกและเมล็ด
            $table->decimal('shell', 10, 3)->default(0)->comment('เปลือก (ตัน)');
            $table->decimal('nut', 10, 3)->default(0)->comment('เมล็ด (ตัน)');
            $table->decimal('nut_out', 10, 3)->default(0)->comment('เมล็ดนอก (ตัน)');

            // ข้อมูล Silo
            $table->decimal('silo_1', 10, 3)->default(0)->comment('Silo 1 (ตัน)');
            $table->decimal('silo_2', 10, 3)->default(0)->comment('Silo 2 (ตัน)');

            $table->timestamps();

            // Indexes
            $table->index('record_date');
            $table->index(['record_date', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_products');
    }
};
