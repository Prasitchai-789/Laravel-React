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
        Schema::create('activity_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->string('image_path');
            $table->string('image_alt_text')->nullable();
            $table->integer('display_order')->default(0);
            $table->bigInteger('uploaded_by')->unsigned();
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('no action');
            $table->timestamps();
            
            $table->index('activity_id');
            $table->index('display_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_images');
    }
};
