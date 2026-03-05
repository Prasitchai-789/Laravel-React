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
            $table->dropUnique('agr_sales_invoice_no_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agr_sales', function (Blueprint $table) {
            $table->unique('invoice_no');
        });
    }
};
