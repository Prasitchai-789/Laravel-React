<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('method', 10);
            $table->string('path', 2048);
            $table->string('route_name')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referer', 2048)->nullable();
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->timestamp('accessed_at')->index();
            $table->timestamps();

            $table->index(['user_id', 'accessed_at']);
            $table->index(['path', 'accessed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_access_logs');
    }
};
