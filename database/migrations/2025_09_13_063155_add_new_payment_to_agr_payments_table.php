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
        Schema::table('agr_payments', function (Blueprint $table) {
         $table->decimal('new_payment', 14, 2)->default(0)->after('amount')->comment('ชำระเงินใหม่');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agr_payments', function (Blueprint $table) {
            $table->dropColumn('new_payment');
        });
    }
};
