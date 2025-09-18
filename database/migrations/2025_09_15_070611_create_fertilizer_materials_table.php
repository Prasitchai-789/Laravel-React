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
        Schema::create('fertilizer_materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('unit'); // เช่น กก., ตัน
            $table->unsignedBigInteger('supplier_id'); // ต้องมี column ก่อน
            $table->foreign('supplier_id')->references('id')->on('fertilizer_suppliers')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_materials');
    }
};
