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
        Schema::create('fertilizer_machine_downtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->onDelete('cascade');
            $table->foreignId('production_id')->onDelete('cascade');
            $table->string('reason')->nullable();
            $table->integer('duration')->default(0); // นาที
            $table->decimal('cost', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_machine_downtimes');
    }
};
