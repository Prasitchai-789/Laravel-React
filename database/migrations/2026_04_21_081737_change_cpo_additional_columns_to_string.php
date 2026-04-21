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
            $table->string('feed_production')->nullable()->change();
            $table->string('despatch_oil')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->decimal('feed_production', 10, 3)->nullable()->change();
            $table->decimal('despatch_oil', 10, 3)->nullable()->change();
        });
    }
};
