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
        Schema::create('palm_forecasts', function (Blueprint $table) {
            $table->id();
            $table->date('forecast_date')->index();
            $table->decimal('volume_forecast', 15, 4);
            $table->decimal('volume_lower_bound', 15, 4);
            $table->decimal('volume_upper_bound', 15, 4);
            $table->decimal('revenue_projection', 15, 4);
            $table->timestamps();
        });

        Schema::create('palm_anomalies', function (Blueprint $table) {
            $table->id();
            $table->date('occurrence_date')->index();
            $table->decimal('actual_volume', 15, 4);
            $table->decimal('expected_volume', 15, 4);
            $table->decimal('deviation_percent', 8, 2);
            $table->string('status'); // WARNING, CRITICAL
            $table->string('type'); // DROP, SPIKE
            $table->boolean('is_notified')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('palm_anomalies');
        Schema::dropIfExists('palm_forecasts');
    }
};
