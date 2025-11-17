<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            // Employee ID จาก Webapp_Emp (เก็บค่าเฉย ๆ)
            $table->unsignedBigInteger('employee_id');

            $table->dateTime('clock_in')->nullable();
            $table->dateTime('clock_out')->nullable();

            $table->integer('late_minutes')->nullable();    // มาสายกี่นาที
            $table->integer('early_minutes')->nullable();   // ออกก่อนกี่นาที
            $table->integer('ot_minutes')->default(0);      // OT

            $table->enum('status', [
                'present',
                'late',
                'absent',
                'leave',
                'holiday',
                'day_off'
            ])->default('present');

            $table->timestamps();

            // ป้องกันซ้ำ
            $table->unique(['employee_id', 'clock_in']);

            // index ช่วยค้นหาเร็ว
            $table->index(['employee_id', 'clock_in']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
