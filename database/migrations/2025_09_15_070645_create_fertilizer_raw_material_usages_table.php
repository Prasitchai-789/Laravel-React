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
        Schema::create('fertilizer_raw_material_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained('fertilizer_productions')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('fertilizer_materials')->onDelete('cascade');
            $table->decimal('qty_used', 14, 2)->default(0);
            $table->decimal('unit_cost', 14, 2)->default(0);
            $table->decimal('total_cost', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_raw_material_usages');
    }
};
