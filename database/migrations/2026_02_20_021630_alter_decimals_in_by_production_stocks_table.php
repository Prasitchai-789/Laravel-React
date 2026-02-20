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
        Schema::table('by_production_stocks', function (Blueprint $table) {
            $table->decimal('initial_palm_quantity', 12, 3)->change();

            // เปอร์เซ็นต์การผลิต
            $table->decimal('efb_fiber_percentage', 8, 3)->default(0)->change();
            $table->decimal('efb_percentage', 8, 3)->default(0)->change();
            $table->decimal('shell_percentage', 8, 3)->default(0)->change();

            // ปริมาณที่ผลิตได้
            $table->decimal('efb_fiber_produced', 12, 3)->default(0)->change();
            $table->decimal('efb_produced', 12, 3)->default(0)->change();
            $table->decimal('shell_produced', 12, 3)->default(0)->change();

            // ยอดยกมา
            $table->decimal('efb_fiber_previous_balance', 12, 3)->default(0)->change();
            $table->decimal('efb_previous_balance', 12, 3)->default(0)->change();
            $table->decimal('shell_previous_balance', 12, 3)->default(0)->change();

            // ขายไป
            $table->decimal('efb_fiber_sold', 12, 3)->default(0)->change();
            $table->decimal('efb_sold', 12, 3)->default(0)->change();
            $table->decimal('shell_sold', 12, 3)->default(0)->change();

            // อื่นๆ
            $table->decimal('efb_fiber_other', 12, 3)->default(0)->change();
            $table->decimal('efb_other', 12, 3)->default(0)->change();
            $table->decimal('shell_other', 12, 3)->default(0)->change();

            // ยอดคงเหลือ
            $table->decimal('efb_fiber_balance', 12, 3)->default(0)->change();
            $table->decimal('efb_balance', 12, 3)->default(0)->change();
            $table->decimal('shell_balance', 12, 3)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('by_production_stocks', function (Blueprint $table) {
            $table->decimal('initial_palm_quantity', 10, 2)->change();

            // เปอร์เซ็นต์การผลิต
            $table->decimal('efb_fiber_percentage', 5, 2)->default(0)->change();
            $table->decimal('efb_percentage', 5, 2)->default(0)->change();
            $table->decimal('shell_percentage', 5, 2)->default(0)->change();

            // ปริมาณที่ผลิตได้
            $table->decimal('efb_fiber_produced', 10, 2)->default(0)->change();
            $table->decimal('efb_produced', 10, 2)->default(0)->change();
            $table->decimal('shell_produced', 10, 2)->default(0)->change();

            // ยอดยกมา
            $table->decimal('efb_fiber_previous_balance', 10, 2)->default(0)->change();
            $table->decimal('efb_previous_balance', 10, 2)->default(0)->change();
            $table->decimal('shell_previous_balance', 10, 2)->default(0)->change();

            // ขายไป
            $table->decimal('efb_fiber_sold', 10, 2)->default(0)->change();
            $table->decimal('efb_sold', 10, 2)->default(0)->change();
            $table->decimal('shell_sold', 10, 2)->default(0)->change();

            // อื่นๆ
            $table->decimal('efb_fiber_other', 10, 2)->default(0)->change();
            $table->decimal('efb_other', 10, 2)->default(0)->change();
            $table->decimal('shell_other', 10, 2)->default(0)->change();

            // ยอดคงเหลือ
            $table->decimal('efb_fiber_balance', 10, 2)->default(0)->change();
            $table->decimal('efb_balance', 10, 2)->default(0)->change();
            $table->decimal('shell_balance', 10, 2)->default(0)->change();
        });
    }
};
