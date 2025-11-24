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
        Schema::create('people_populations', function (Blueprint $table) {
            $table->id();
            // ข้อมูลส่วนบุคคล
            $table->string('national_id', 20)->unique();
            $table->string('title')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->date('birthdate')->nullable();
            $table->enum('gender', ['M', 'F', 'OTHER'])->nullable();

            // ที่อยู่
            $table->string('house_no')->nullable();
            $table->integer('village_no')->nullable();
            $table->string('village_name')->nullable();

            // FK ไปยังตาราง Webapp_City
            $table->integer('city_id')->nullable();  // ไม่ใช้ FK เพื่อรองรับ SQLServer cross-db

            // วันทำบัตร
            $table->date('id_card_issued_at')->nullable();
            $table->date('id_card_expired_at')->nullable();

            // อื่น ๆ
            $table->string('religion')->nullable();
            $table->integer('age_at_import')->nullable();
            $table->string('phone')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('people_populations');
    }
};
