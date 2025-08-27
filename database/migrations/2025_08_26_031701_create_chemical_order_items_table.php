<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chemical_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('chemical_id');
            $table->decimal('quantity', 12, 2);
            $table->decimal('remaining_quantity', 12, 2);
            $table->string('unit');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->date('expiry_date')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('chemical_orders')->onDelete('cascade');
            $table->foreign('chemical_id')->references('id')->on('chemicals')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chemical_order_items');
    }
};
