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
        Schema::create('mar_loading_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 50)->unique();
            $table->date('request_date')->index();
            $table->unsignedInteger('sequence');
            $table->string('SOPID', 50)->index();
            $table->string('GoodID', 50)->nullable()->index();
            $table->string('NumberCar', 100)->nullable()->index();
            $table->string('CustID', 50)->nullable()->index();
            $table->timestamps();

            $table->unique('SOPID');
            $table->index(['request_date', 'sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mar_loading_requests');
    }
};
