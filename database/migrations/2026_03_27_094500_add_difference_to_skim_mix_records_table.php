<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skim_mix_records', function (Blueprint $table) {
            $table->decimal('difference', 8, 3)->nullable()->after('volume');
        });
    }

    public function down(): void
    {
        Schema::table('skim_mix_records', function (Blueprint $table) {
            $table->dropColumn('difference');
        });
    }
};
