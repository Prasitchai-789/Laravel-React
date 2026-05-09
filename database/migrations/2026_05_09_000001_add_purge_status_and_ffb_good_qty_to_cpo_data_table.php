<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->boolean('purge_system_status')->default(false)->after('purge_system');
            $table->decimal('ffb_good_qty', 12, 3)->nullable()->after('product_cpo');
        });
    }

    public function down(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->dropColumn(['purge_system_status', 'ffb_good_qty']);
        });
    }
};
