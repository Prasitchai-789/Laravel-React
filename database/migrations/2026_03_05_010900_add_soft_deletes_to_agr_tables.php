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
        Schema::table('agr_sales', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('agr_sale_items', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('agr_payments', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agr_sales', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('agr_sale_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('agr_payments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
