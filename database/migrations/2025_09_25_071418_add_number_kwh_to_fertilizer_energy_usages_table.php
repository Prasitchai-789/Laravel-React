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
        Schema::table('fertilizer_energy_usages', function (Blueprint $table) {
            $table->decimal('number_kwh', 10, 2)->nullable()->after('some_existing_column');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fertilizer_energy_usages', function (Blueprint $table) {
            $table->dropColumn('number_kwh');
        });
    }
};
