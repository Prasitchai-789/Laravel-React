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
            $table->foreignId('product_id')->after('sale_date');
            $table->foreignId('store_id')->after('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agr_sales', function (Blueprint $table) {
            $table->dropColumn('product_id');
            $table->dropColumn('store_id');
        });
    }
};
