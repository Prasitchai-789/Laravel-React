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
        Schema::create('cpo_oil_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpo_record_id')->constrained('cpo_records')->cascadeOnDelete();

            $table->decimal('total_cpo', 10, 3)->nullable();
            $table->decimal('ffa_cpo', 10, 3)->nullable();
            $table->decimal('dobi_cpo', 10, 3)->nullable();
            $table->decimal('cs1_cm', 10, 3)->nullable();
            $table->decimal('undilute_1', 10, 3)->nullable();
            $table->decimal('undilute_2', 10, 3)->nullable();
            $table->decimal('setting', 10, 3)->nullable();
            $table->decimal('clean_oil', 10, 3)->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cpo_oil_rooms');
    }
};
