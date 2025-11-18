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
        Schema::create('by_production_stocks', function (Blueprint $table) {
            $table->id();
            $table->date('production_date');
            $table->decimal('initial_palm_quantity', 10, 2); // ปริมาณผลปาล์มตั้งต้น (ตัน)

            // เปอร์เซ็นต์การผลิต
            $table->decimal('efb_fiber_percentage', 5, 2)->default(0);
            $table->decimal('efb_percentage', 5, 2)->default(0);
            $table->decimal('shell_percentage', 5, 2)->default(0);

            // ปริมาณที่ผลิตได้
            $table->decimal('efb_fiber_produced', 10, 2)->default(0);
            $table->decimal('efb_produced', 10, 2)->default(0);
            $table->decimal('shell_produced', 10, 2)->default(0);

            // ยอดยกมา
            $table->decimal('efb_fiber_previous_balance', 10, 2)->default(0);
            $table->decimal('efb_previous_balance', 10, 2)->default(0);
            $table->decimal('shell_previous_balance', 10, 2)->default(0);

            // ขายไป
            $table->decimal('efb_fiber_sold', 10, 2)->default(0);
            $table->decimal('efb_sold', 10, 2)->default(0);
            $table->decimal('shell_sold', 10, 2)->default(0);

            // อื่นๆ
            $table->decimal('efb_fiber_other', 10, 2)->default(0);
            $table->decimal('efb_other', 10, 2)->default(0);
            $table->decimal('shell_other', 10, 2)->default(0);

            // ยอดคงเหลือ
            $table->decimal('efb_fiber_balance', 10, 2)->default(0);
            $table->decimal('efb_balance', 10, 2)->default(0);
            $table->decimal('shell_balance', 10, 2)->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('by_production_stocks');
    }
};
