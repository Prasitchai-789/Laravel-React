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
        Schema::create('agr_sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique(); // เลขที่ใบจอง
            $table->foreignId('customer_id');
            $table->date('sale_date');
            $table->date('pickup_date')->nullable(); // วันที่นัดรับ
            $table->enum('status', ['reserved', 'completed', 'cancelled'])->default('reserved'); // การจอง/รับแล้ว
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->decimal('deposit', 14, 2)->default(0); // เงินจอง
            $table->decimal('deposit_percent', 5, 2)->default(20); // default 20%
            $table->decimal('paid_amount', 14, 2)->default(0); // รวมจ่ายแล้ว
            $table->decimal('balance_due', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agr_sales');
    }
};
