<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perples', function (Blueprint $table) {
            $table->id();

            $table->string('title')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('house_no')->nullable();
            $table->integer('village_no')->nullable();
            $table->string('subdistrict_name')->nullable();
            $table->string('district_name')->nullable();
            $table->string('province_name')->nullable();
            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perples');
    }
};
