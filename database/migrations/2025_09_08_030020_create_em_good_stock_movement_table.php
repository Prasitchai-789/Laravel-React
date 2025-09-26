<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('em_good_stock_movement', function (Blueprint $table) {
            $table->id('movement_id');
            $table->unsignedBigInteger('good_id');
            $table->string('docu_no', 50);
            $table->unsignedBigInteger('movement_type_id');
            $table->decimal('quantity', 18, 2);
            $table->unsignedBigInteger('reference_movement_id')->nullable();
            $table->dateTime('docu_date')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->string('user_id', 50)->nullable();
            $table->string('remark', 255)->nullable();
            $table->timestamps();

            // Foreign Key
            $table->foreign('good_id')->references('id')->on('em_good');
            $table->foreign('movement_type_id')->references('movement_type_id')->on('movement_type');
            $table->foreign('reference_movement_id')->references('movement_id')->on('em_good_stock_movement');
            $table->foreign('docu_no')->references('docu_no')->on('ic_docu_type_hd');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('em_good_stock_movement');
    }
};
