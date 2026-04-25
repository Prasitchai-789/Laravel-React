<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('water_usage_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date')->unique();
            $table->decimal('wastewater_volume', 12, 2)->default(0);
            $table->decimal('raw_water_volume', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('report_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('water_usage_reports');
    }
};
