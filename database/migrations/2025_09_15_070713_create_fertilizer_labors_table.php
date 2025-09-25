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
        Schema::create('fertilizer_labors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained(table: 'fertilizer_productions')->onDelete('cascade');
            $table->integer('workers')->default(0);
            $table->decimal('hours', 14, 2)->default(0);
            $table->decimal('ot_hours', 14, 2)->default(0);
            $table->decimal('labor_cost', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_labors');
    }
};
