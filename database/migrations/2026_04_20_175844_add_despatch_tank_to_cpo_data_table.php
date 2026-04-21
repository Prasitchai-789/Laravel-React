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
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->string('despatch_tank')->nullable()->after('despatch_oil');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->dropColumn('despatch_tank');
        });
    }
};
