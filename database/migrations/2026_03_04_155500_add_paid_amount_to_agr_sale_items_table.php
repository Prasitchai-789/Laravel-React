<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agr_sale_items', function (Blueprint $table) {
            $table->decimal('paid_amount', 14, 2)->default(0)->after('line_total')->comment('ยอดชำระแล้วของสินค้าตัวนี้');
            $table->enum('payment_status', ['pending', 'partial', 'completed'])->default('pending')->after('paid_amount')->comment('สถานะชำระรายสินค้า');
        });
    }

    public function down(): void
    {
        Schema::table('agr_sale_items', function (Blueprint $table) {
            $table->dropColumn(['paid_amount', 'payment_status']);
        });
    }
};
