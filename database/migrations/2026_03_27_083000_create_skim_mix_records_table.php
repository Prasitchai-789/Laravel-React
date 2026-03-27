<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skim_mix_records', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->decimal('oil_level', 8, 3)->nullable();
            $table->decimal('temperature', 8, 3)->nullable();
            $table->decimal('volume', 8, 3)->nullable();
            $table->enum('type', ['skim', 'mix']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skim_mix_records');
    }
};
