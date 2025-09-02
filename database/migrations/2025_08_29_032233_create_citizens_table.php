<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('citizens', function (Blueprint $table) {
            $table->id();
            $table->string('citizen_id', 13)->unique();         // เลขบัตรประชาชน
            $table->string('title', 30)->nullable();           // คำนำหน้า
            $table->string('first_name', 100);                 // ชื่อ
            $table->string('last_name', 100);                  // นามสกุล
            $table->date('birth_date')->nullable();            // วันเดือนปีเกิด
            $table->string('gender', 20)->nullable();          // เพศ
            $table->string('house_no', 50)->nullable();        // บ้านเลขที่
            $table->string('moo', 191)->nullable();            // หมู่ที่ (เพิ่มจาก 50 → 191)
            $table->string('alley', 100)->nullable();          // ตรอก
            $table->string('soi', 100)->nullable();            // ซอย
            $table->string('road', 100)->nullable();           // ถนน
            $table->string('subdistrict', 100)->nullable();    // ตำบล
            $table->string('district', 100)->nullable();       // อำเภอ
            $table->string('province', 100)->nullable();       // จังหวัด
            $table->date('card_issue_date')->nullable();       // วันทำบัตร
            $table->date('card_expire_date')->nullable();      // วันหมดอายุ
            $table->string('religion', 50)->nullable();        // ศาสนา
            $table->integer('age')->nullable();                // อายุ
            $table->string('phone', 20)->nullable();           // เบอร์โทร
            $table->string('photo', 255)->nullable();          // รูป
            $table->string('village_name', 100)->nullable();   // ชื่อหมู่บ้าน
            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('citizens');
    }
};
