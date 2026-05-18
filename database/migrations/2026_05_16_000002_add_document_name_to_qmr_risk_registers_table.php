<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('qmr_risk_registers', function (Blueprint $table) {
            $table->string('document_name')->default('แบบฟอร์มการประเมินความเสี่ยงและโอกาสด้านคุณภาพ')->after('document_code');
        });
    }

    public function down(): void
    {
        Schema::table('qmr_risk_registers', function (Blueprint $table) {
            $table->dropColumn('document_name');
        });
    }
};
