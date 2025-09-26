<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {

        
    Schema::create('store_orders', function (Blueprint $table) {
    $table->id();
    $table->string('document_number')->unique();
    $table->dateTime('order_date')->default(now());
    $table->string('status')->default('รออนุมัติ');
    $table->string('department');
    $table->string('requester');
     $table->text('note')->nullable(); 
    $table->timestamps();
});



    }

    public function down(): void
    {
        Schema::dropIfExists('store_orders');
    }
};
