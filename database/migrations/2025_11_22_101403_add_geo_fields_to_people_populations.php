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
        Schema::table('people_populations', function (Blueprint $table) {
            $table->string('subdistrict_name')->nullable()->after('village_name');
            $table->string('district_name')->nullable()->after('subdistrict_name');
            $table->string('province_name')->nullable()->after('district_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('people_populations', function (Blueprint $table) {
            $table->dropColumn(['subdistrict_name', 'district_name', 'province_name']);
        });
    }
};
