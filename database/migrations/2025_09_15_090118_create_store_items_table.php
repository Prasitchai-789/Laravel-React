<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_items', function (Blueprint $table) {
            $table->id();
            $table->string('good_id');                // รหัสสินค้าอ้างอิงจาก Winspeed
            $table->string('good_code');              // ชื่อสินค้า (ใช้เก็บชื่อ)
            $table->string('GoodUnitID')->default('pcs');   // หน่วยนับ
            $table->decimal('stock_qty', 12, 2)->default(0);
            $table->decimal('safety_stock', 12, 2)->default(0);
            $table->decimal('price', 12, 2)->default(0);
            $table->timestamps();
        });



    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_items');
    }
};
