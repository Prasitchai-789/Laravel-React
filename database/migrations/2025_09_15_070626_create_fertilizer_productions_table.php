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
        Schema::create('fertilizer_productions', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('shift'); // A, B, C
            $table->foreignId('line_id')->references('id')->on('fertilizer_lines')->onDelete('cascade');
            $table->decimal('product_qty', 14, 2)->default(0);
            $table->decimal('target_qty', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_productions');
    }
};
