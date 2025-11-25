<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('seeder_status', function (Blueprint $table) {
            $table->id();
            $table->json('received_items')->default(json_encode([]));
            $table->timestamps();

            $table->unique('user_id');

            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seeder_status');
    }
};
