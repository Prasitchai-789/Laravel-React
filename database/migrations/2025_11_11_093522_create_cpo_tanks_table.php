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
        Schema::create('cpo_tanks', function (Blueprint $table) {
            $table->id();
             $table->foreignId('cpo_record_id')->constrained('cpo_records')->cascadeOnDelete();
            $table->integer('tank_no');
            $table->decimal('oil_level', 10, 3)->nullable();
            $table->decimal('temperature', 10, 2)->nullable();
            $table->decimal('cpo_volume', 10, 3)->nullable();

            // สำหรับ Tank 1
            $table->decimal('ffa', 10, 3)->nullable();
            $table->decimal('moisture', 10, 3)->nullable();
            $table->decimal('dobi', 10, 3)->nullable();

            // สำหรับ Tank 2-4 (Top & Bottom)
            $table->decimal('top_ffa', 10, 3)->nullable();
            $table->decimal('top_moisture', 10, 3)->nullable();
            $table->decimal('top_dobi', 10, 3)->nullable();
            $table->decimal('bottom_ffa', 10, 3)->nullable();
            $table->decimal('bottom_moisture', 10, 3)->nullable();
            $table->decimal('bottom_dobi', 10, 3)->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cpo_tanks');
    }
};
