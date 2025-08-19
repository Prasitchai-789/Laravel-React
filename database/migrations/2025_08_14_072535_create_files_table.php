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
        Schema::create('files', function (Blueprint $table) {
            $table->id();
             // Polymorphic relation (เชื่อมได้ทั้ง Project หรือ Task)
            $table->unsignedBigInteger('fileable_id');
            $table->string('fileable_type');

            // Path ของไฟล์
            $table->string('file_path');

            // ผู้ที่อัปโหลดไฟล์ (user)
            $table->foreignId('uploaded_by')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
