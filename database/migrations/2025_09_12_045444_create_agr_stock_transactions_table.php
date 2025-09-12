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
        Schema::create('agr_stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('agr_products')->onDelete('cascade');
            $table->enum('transaction_type', ['in', 'out']); // รับเข้า หรือ จ่ายออก
            $table->integer('quantity'); // จำนวนที่เคลื่อนไหว
            $table->integer('balance_after'); // คงเหลือหลังจากเคลื่อนไหว
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agr_stock_transactions');
    }
};
