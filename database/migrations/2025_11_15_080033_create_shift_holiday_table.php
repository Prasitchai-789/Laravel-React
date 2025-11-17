<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_holiday', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
            $table->foreignId('holiday_id')->constrained('holidays')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['shift_id', 'holiday_id']); // ป้องกัน duplicate
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_holiday');
    }
};
