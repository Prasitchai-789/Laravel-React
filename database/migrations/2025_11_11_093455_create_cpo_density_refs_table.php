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
        Schema::create('cpo_density_refs', function (Blueprint $table) {
            $table->id();
             $table->decimal('temperature_c', 5, 2); // อุณหภูมิ (°C)
            $table->decimal('density', 8, 4);      // ความหนาแน่น (g/cm³ หรือ kg/L)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cpo_density_refs');
    }
};
