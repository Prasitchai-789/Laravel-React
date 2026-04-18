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
        if (!Schema::connection('sqlsrv')->hasTable('delivery_plan_references')) {
            Schema::connection('sqlsrv')->create('delivery_plan_references', function (Blueprint $table) {
                $table->id();
                $table->string('ref_key')->unique();
                $table->text('ref_value')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_plan_references');
    }
};
