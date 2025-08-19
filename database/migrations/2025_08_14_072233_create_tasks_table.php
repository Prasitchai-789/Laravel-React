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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            // เชื่อมกับ projects
            $table->foreignId('project_id')
                  ->constrained('projects')
                  ->onDelete('cascade');

            $table->string('name'); // ชื่องาน
            $table->text('description')->nullable(); // รายละเอียดงาน

            // สถานะงาน
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'delayed'])
                  ->default('not_started');

            // ความคืบหน้า (0-100)
            $table->unsignedTinyInteger('progress')->default(0);

            // กำหนดวันครบกำหนด
            $table->date('due_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
