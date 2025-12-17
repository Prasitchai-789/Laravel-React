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
        Schema::table('cpo_data', function (Blueprint $table) {
            // Production mode
            $table->string('production_mode', 20)->default('production')->after('date');
            
            // Per-tank sales (tons)
            $table->decimal('tank1_sale', 8, 3)->nullable()->after('tank1_dobi');
            $table->decimal('tank2_sale', 8, 3)->nullable()->after('tank2_bottom_dobi');
            $table->decimal('tank3_sale', 8, 3)->nullable()->after('tank3_bottom_dobi');
            $table->decimal('tank4_sale', 8, 3)->nullable()->after('tank4_bottom_dobi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cpo_data', function (Blueprint $table) {
            $table->dropColumn([
                'production_mode',
                'tank1_sale',
                'tank2_sale',
                'tank3_sale',
                'tank4_sale',
            ]);
        });
    }
};
