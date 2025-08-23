<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('daily_chemicals', function (Blueprint $table) {
            $table->id();
            $table->date('date');                    // วันที่ผลิต
            $table->enum('shift', ['A', 'B']);      // กะ A หรือ B
            $table->string('chemical_name');        // ชื่อสารเคมี
            $table->string('unit');                  // หน่วย เช่น ลิตร, กก.
            $table->decimal('quantity', 10, 2);     // จำนวนที่ใช้
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_chemicals');
    }
};

