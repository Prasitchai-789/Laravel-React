<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->decimal('oil_loss', 10, 3)->nullable()->after('adjustment');
        });
    }

    public function down(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->dropColumn('oil_loss');
        });
    }
};
