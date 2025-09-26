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
        Schema::create('fertilizer_machines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('line_id')->constrained('fertilizer_lines')->onDelete('cascade');
            $table->decimal('depreciation_rate', 14, 2)->default(0); // ค่าเสื่อม
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_machines');
    }
};
