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
        if (!Schema::hasColumn('agr_products', 'store_id')) {
            Schema::table('agr_products', function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->after('store');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agr_products', function (Blueprint $table) {
            $table->dropColumn('store_id');
        });
    }
};
