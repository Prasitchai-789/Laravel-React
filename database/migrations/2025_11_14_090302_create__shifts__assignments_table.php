<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    protected $connection = 'sqlsrv'; // ระบุ connection ให้ตรงกับ Webapp_Emp

    public function up(): void
    {
        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();

            // Employee ID จาก Webapp_Emp (เก็บค่าเฉย ๆ)
            $table->integer('employee_id');

            // Shift ID จากตาราง shifts
            $table->foreignId('shift_id')
                ->constrained('shifts') // shifts อยู่บน default connection
                ->cascadeOnDelete();

            $table->date('date'); // วันที่ assign กะ

            $table->timestamps();

            // ป้องกันการ assign ซ้ำ
            $table->unique(['employee_id', 'date']);

            // index ช่วยค้นหาเร็ว
            $table->index(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_assignments');
    }
};
