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
        Schema::create('fertilizer_energy_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained('fertilizer_productions')->onDelete('cascade');
            $table->decimal('electricity_kwh', 14, 2)->default(0);
            $table->decimal('fuel_litre', 14, 2)->default(0);
            $table->decimal('cost', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_energy_usages');
    }
};
