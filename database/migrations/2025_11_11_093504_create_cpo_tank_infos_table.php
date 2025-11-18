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
        Schema::create('cpo_tank_infos', function (Blueprint $table) {
            $table->id();
            $table->integer('tank_no')->unique();
            $table->decimal('height_m', 8, 3);          // ความสูง (เมตร)
            $table->decimal('diameter_m', 8, 3);        // เส้นผ่านศูนย์กลาง (เมตร)
            $table->decimal('volume_m3', 12, 4);        // ปริมาตร (ลูกบาศก์เมตร)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cpo_tank_infos');
    }
};
