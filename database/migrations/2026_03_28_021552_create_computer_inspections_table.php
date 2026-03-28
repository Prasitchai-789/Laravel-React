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
        Schema::create('computer_inspections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('computer_id'); // From sqlsrv3 DB
            $table->date('inspection_date');
            $table->json('data')->nullable();
            $table->text('remark')->nullable();
            $table->json('image_paths')->nullable();
            $table->string('checked_by')->nullable();
            $table->timestamps();
            
            $table->index(['computer_id', 'inspection_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('computer_inspections');
    }
};
