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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // ชื่อโครงการ
            $table->text('description')->nullable(); // รายละเอียดโครงการ
            $table->date('start_date')->nullable(); // วันเริ่ม
            $table->date('end_date')->nullable(); // วันสิ้นสุด
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'delayed'])
                  ->default('not_started'); // สถานะ
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
