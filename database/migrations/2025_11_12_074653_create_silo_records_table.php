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
        Schema::create('silo_records', function (Blueprint $table) {
            $table->id();
            $table->date('record_date');
            $table->decimal('nut_silo_1_level', 8, 2);
            $table->decimal('nut_silo_2_level', 8, 2);
            $table->decimal('nut_silo_3_level', 8, 2);
            $table->decimal('kernel_silo_1_level', 8, 2);
            $table->decimal('kernel_silo_2_level', 8, 2);
            $table->decimal('silo_sale_big_level', 8, 2);
            $table->decimal('silo_sale_small_level', 8, 2);
            $table->decimal('kernel_outside_pile', 8, 2);
            $table->decimal('moisture_percent', 8, 2);
            $table->decimal('shell_percent', 8, 2);
            $table->decimal('outside_nut', 8, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('silo_records');
    }
};
