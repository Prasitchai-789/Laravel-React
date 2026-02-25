<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('silo_records', function (Blueprint $table) {
            // สถานะการผลิต: true = ผลิต, false = ไม่ผลิต
            $table->boolean('is_production')->default(true)->after('record_date');
        });
    }

    public function down(): void
    {
        Schema::table('silo_records', function (Blueprint $table) {
            $table->dropColumn('is_production');
        });
    }
};
