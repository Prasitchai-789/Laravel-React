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
        Schema::create('agr_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id');
            $table->date('paid_at');
            $table->decimal('amount', 14, 2);
            $table->string('method')->nullable(); // cash/transfer
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agr_payments');
    }
};
