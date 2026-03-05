<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agr_payments', function (Blueprint $table) {
            $table->unsignedBigInteger('sale_item_id')->nullable()->after('sale_id')->comment('ผูกกับสินค้าตัวไหนในบิล (nullable = จ่ายรวมทั้งบิล)');
        });
    }

    public function down(): void
    {
        Schema::table('agr_payments', function (Blueprint $table) {
            $table->dropColumn('sale_item_id');
        });
    }
};
