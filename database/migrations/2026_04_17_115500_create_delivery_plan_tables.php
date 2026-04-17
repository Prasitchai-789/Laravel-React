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
        if (!Schema::connection('sqlsrv')->hasTable('orders')) {
            Schema::connection('sqlsrv')->create('orders', function (Blueprint $table) {
                $table->id();
                $table->string('customer_name');
                $table->string('product');
                $table->decimal('quantity', 15, 2);
                $table->decimal('price_sell', 15, 2);
                $table->decimal('price_customer', 15, 2);
                $table->timestamps();
            });
        }

        if (!Schema::connection('sqlsrv')->hasTable('delivery_plan_items')) {
            Schema::connection('sqlsrv')->create('delivery_plan_items', function (Blueprint $table) {
                $table->id();
                // order_id is bigint unsigned, refering to orders
                $table->bigInteger('order_id')->unsigned();
                $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
                
                $table->date('plan_date');
                $table->decimal('quantity', 15, 2);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('sqlsrv')->dropIfExists('delivery_plan_items');
        Schema::connection('sqlsrv')->dropIfExists('orders');
    }
};
