<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chemical_orders', function (Blueprint $table) {
            $table->id();
            $table->string('lot_number')->unique();
            $table->date('order_date');
            $table->enum('status', ['Pending', 'Approved', 'Received'])->default('Pending');
            $table->unsignedBigInteger('created_by'); // user_id
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chemical_orders');
    }
};
