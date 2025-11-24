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
        Schema::create('cpo_data', function (Blueprint $table) {
            $table->id();
            $table->date('date');

            // Tank 1
            $table->decimal('tank1_oil_level', 8, 3)->nullable();
            $table->decimal('tank1_temperature', 8, 2)->nullable();
            $table->decimal('tank1_cpo_volume', 8, 3)->nullable();
            $table->decimal('tank1_ffa', 8, 2)->nullable();
            $table->decimal('tank1_moisture', 8, 2)->nullable();
            $table->decimal('tank1_dobi', 8, 2)->nullable();

            // Tank 2
            $table->decimal('tank2_oil_level', 8, 3)->nullable();
            $table->decimal('tank2_temperature', 8, 2)->nullable();
            $table->decimal('tank2_cpo_volume', 8, 3)->nullable();
            $table->decimal('tank2_top_ffa', 8, 2)->nullable();
            $table->decimal('tank2_top_moisture', 8, 2)->nullable();
            $table->decimal('tank2_top_dobi', 8, 2)->nullable();
            $table->decimal('tank2_bottom_ffa', 8, 2)->nullable();
            $table->decimal('tank2_bottom_moisture', 8, 2)->nullable();
            $table->decimal('tank2_bottom_dobi', 8, 2)->nullable();

            // Tank 3
            $table->decimal('tank3_oil_level', 8, 3)->nullable();
            $table->decimal('tank3_temperature', 8, 2)->nullable();
            $table->decimal('tank3_cpo_volume', 8, 3)->nullable();
            $table->decimal('tank3_top_ffa', 8, 2)->nullable();
            $table->decimal('tank3_top_moisture', 8, 2)->nullable();
            $table->decimal('tank3_top_dobi', 8, 2)->nullable();
            $table->decimal('tank3_bottom_ffa', 8, 2)->nullable();
            $table->decimal('tank3_bottom_moisture', 8, 2)->nullable();
            $table->decimal('tank3_bottom_dobi', 8, 2)->nullable();

            // Tank 4
            $table->decimal('tank4_oil_level', 8, 3)->nullable();
            $table->decimal('tank4_temperature', 8, 2)->nullable();
            $table->decimal('tank4_cpo_volume', 8, 3)->nullable();
            $table->decimal('tank4_top_ffa', 8, 2)->nullable();
            $table->decimal('tank4_top_moisture', 8, 2)->nullable();
            $table->decimal('tank4_top_dobi', 8, 2)->nullable();
            $table->decimal('tank4_bottom_ffa', 8, 2)->nullable();
            $table->decimal('tank4_bottom_moisture', 8, 2)->nullable();
            $table->decimal('tank4_bottom_dobi', 8, 2)->nullable();

            // Oil Room
            $table->decimal('total_cpo', 8, 3)->nullable();
            $table->decimal('ffa_cpo', 8, 2)->nullable();
            $table->decimal('dobi_cpo', 8, 2)->nullable();
            $table->decimal('cs1_cm', 8, 2)->nullable();
            $table->decimal('undilute_1', 8, 2)->nullable();
            $table->decimal('undilute_2', 8, 2)->nullable();
            $table->decimal('setting', 8, 2)->nullable();
            $table->decimal('clean_oil', 8, 2)->nullable();
            $table->decimal('skim', 8, 2)->nullable();
            $table->decimal('mix', 8, 2)->nullable();
            $table->decimal('loop_back', 8, 2)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cpo_data');
    }
};
