<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('store_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_order_id')
                  ->constrained('store_orders')  // foreign key to store_orders table
                  ->onDelete('cascade');
            $table->foreignId('product_id')
                  ->constrained('order_products') // foreign key to order_products table
                  ->onDelete('cascade');
            $table->decimal('quantity', 18, 2); // จำนวนที่เบิก
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_order_items');
    }
};
