<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('guard_patrol_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checkpoint_id')->nullable()->constrained('checkpoints')->nullOnDelete();
            $table->foreignId('guard_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guard_name')->nullable();
            $table->string('checkpoint_code', 80);
            $table->decimal('scan_latitude', 10, 7);
            $table->decimal('scan_longitude', 10, 7);
            $table->decimal('checkpoint_latitude', 10, 7)->nullable();
            $table->decimal('checkpoint_longitude', 10, 7)->nullable();
            $table->unsignedInteger('allowed_radius_meters')->nullable();
            $table->decimal('distance_meters', 10, 2)->nullable();
            $table->boolean('is_within_radius')->default(false);
            $table->string('status', 30)->default('invalid_checkpoint');
            $table->text('note')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('checked_at');
            $table->boolean('telegram_sent')->default(false);
            $table->timestamp('telegram_sent_at')->nullable();
            $table->timestamps();

            $table->index(['checkpoint_id', 'checked_at']);
            $table->index(['guard_id', 'checked_at']);
            $table->index(['status', 'checked_at']);
            $table->index('checkpoint_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guard_patrol_logs');
    }
};
