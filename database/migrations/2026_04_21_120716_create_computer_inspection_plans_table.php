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
        Schema::create('computer_inspection_plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('computer_id');
            $table->integer('month');
            $table->integer('year');
            $table->string('status')->default('planned'); // planned, completed, cancelled
            $table->string('planned_by')->nullable();
            $table->timestamps();

            $table->unique(['computer_id', 'month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('computer_inspection_plans');
    }
};
