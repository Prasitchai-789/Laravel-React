<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('sqlsrv')->create('vehicle_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('sop_id')->index(); // อ้างอิง SOPID
            $table->boolean('is_clean')->default(false); // 1. สะอาด
            $table->boolean('is_covered')->default(false); // 2. มีผ้าใบคลุม
            $table->boolean('is_no_smell')->default(false); // 3. ไม่มีกลิ่นเหม็น
            $table->boolean('is_doc_valid')->default(false); // 4. เอกสารตรง
            $table->text('remark')->nullable();
            $table->string('inspector_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('sqlsrv')->dropIfExists('vehicle_inspections');
    }
};
