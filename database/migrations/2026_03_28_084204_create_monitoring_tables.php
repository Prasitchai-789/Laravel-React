<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mac_address')->unique();
            $table->string('ip_address')->nullable();
            $table->enum('type', ['computer', 'cctv']);
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->enum('status', ['online', 'offline'])->default('offline');
            $table->dateTime('last_seen')->nullable();
            $table->timestamps();
        });

        Schema::create('device_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->decimal('cpu_usage', 5, 2)->default(0);
            $table->decimal('ram_usage', 5, 2)->default(0);
            $table->decimal('disk_usage', 5, 2)->default(0);
            $table->timestamps();

            // Indexes for performance
            $table->index('device_id');
            $table->index('created_at');
        });

        Schema::create('device_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->string('status');
            $table->text('message')->nullable();
            $table->timestamps();
        });

        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->enum('type', ['offline', 'warning']);
            $table->text('message');
            $table->boolean('sent_line')->default(false);
            $table->timestamps();
        });

        Schema::create('checklists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['computer', 'cctv']);
        });

        Schema::create('checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checklist_id')->constrained('checklists')->cascadeOnDelete();
            $table->string('title');
        });

        Schema::create('checklist_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('checklist_item_id')->constrained('checklist_items')->cascadeOnDelete();
            $table->enum('status', ['normal', 'issue', 'broken', 'cleaned']);
            $table->text('note')->nullable();
            $table->string('checked_by');
            $table->timestamp('checked_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('checklist_logs');
        Schema::dropIfExists('checklist_items');
        Schema::dropIfExists('checklists');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('device_logs');
        Schema::dropIfExists('device_metrics');
        Schema::dropIfExists('devices');
        Schema::dropIfExists('locations');
    }
};
