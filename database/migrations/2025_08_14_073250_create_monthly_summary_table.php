<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('monthly_summary', function (Blueprint $table) {
            $table->id();
            $table->date('month');                  
            $table->enum('shift', ['A', 'B']);      
            $table->integer('total_days');          
            $table->decimal('total_quantity', 10, 2); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_summary');
    }
};
