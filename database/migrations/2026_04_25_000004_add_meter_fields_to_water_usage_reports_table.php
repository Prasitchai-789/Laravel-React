<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('water_usage_reports', function (Blueprint $table) {
            $table->decimal('wastewater_meter_before', 12, 2)->default(0);
            $table->decimal('wastewater_meter_after', 12, 2)->default(0);
            $table->decimal('water_treatment_meter_before', 12, 2)->default(0);
            $table->decimal('water_treatment_meter_after', 12, 2)->default(0);
            $table->decimal('water_treatment_volume', 12, 2)->default(0);
            $table->decimal('sludge_weight_kg', 12, 2)->default(0);
            $table->decimal('em_usage_liter', 12, 2)->default(0);
            $table->decimal('molasses_usage_liter', 12, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('water_usage_reports', function (Blueprint $table) {
            $table->dropColumn([
                'wastewater_meter_before',
                'wastewater_meter_after',
                'water_treatment_meter_before',
                'water_treatment_meter_after',
                'water_treatment_volume',
                'sludge_weight_kg',
                'em_usage_liter',
                'molasses_usage_liter',
            ]);
        });
    }
};
