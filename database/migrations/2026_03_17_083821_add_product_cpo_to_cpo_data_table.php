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
            $table->decimal('product_cpo', 8, 3)->nullable()->after('total_cpo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->dropColumn('product_cpo');
        });
    }
};
