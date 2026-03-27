<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dvrs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->integer('camera_count')->default(0);
            $table->timestamps();
        });

        Schema::create('cctv_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dvr_id')->constrained('dvrs')->onDelete('cascade');
            $table->date('inspection_date');
            $table->json('camera_data');
            $table->string('dvr_remark', 500)->nullable();
            $table->string('image_path')->nullable();
            $table->string('checked_by', 100)->nullable();
            $table->timestamps();

            $table->unique(['dvr_id', 'inspection_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cctv_inspections');
        Schema::dropIfExists('dvrs');
    }
};
