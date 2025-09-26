<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_movements', function (Blueprint $table) {
            $table->id();

            // เชื่อมกับ store_items.id
            $table->unsignedBigInteger('store_item_id');
            $table->foreign('store_item_id')->references('id')->on('store_items')->onDelete('cascade');

            // ประเภท movement: reserve / issue / return / adjustment
            $table->enum('movement_type', ['reserve', 'issue', 'return','adjustment']);

            // ประเภทการปรับ stock / safety: add / subtract
            $table->enum('type', ['add', 'subtract']);

            // ระบุว่าปรับ stock หรือ safety
            $table->enum('category', ['stock', 'safety']);

            $table->decimal('quantity', 12, 2); // จำนวนที่ปรับ
            $table->text('note')->nullable();

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_movements');
    }
};
