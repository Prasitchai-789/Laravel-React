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
        Schema::create('fertilizer_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained('fertilizer_productions')->onDelete('cascade');
            $table->string('issue_type'); // เครื่องจักร, วัตถุดิบ, แรงงาน, พลังงาน
            $table->text('description')->nullable();
            $table->integer('duration')->default(0); // นาที
            $table->enum('status', ['open', 'resolved'])->default('open');
            $table->timestamps();;
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fertilizer_issues');
    }
};
