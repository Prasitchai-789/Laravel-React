<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('qmr_risk_registers', function (Blueprint $table) {
            $table->index('created_at', 'qmr_risk_registers_created_at_idx');
            $table->index(['issue_type', 'risk_level'], 'qmr_risk_registers_issue_level_idx');
            $table->index('process_name', 'qmr_risk_registers_process_name_idx');
            $table->index('improvement_level', 'qmr_risk_registers_improvement_level_idx');
        });

        Schema::table('qmr_risk_kpis', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'qmr_risk_kpis_status_created_at_idx');
        });

        Schema::table('qmr_risk_controls', function (Blueprint $table) {
            $table->index(['status', 'updated_at'], 'qmr_risk_controls_status_updated_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('qmr_risk_controls', function (Blueprint $table) {
            $table->dropIndex('qmr_risk_controls_status_updated_at_idx');
        });

        Schema::table('qmr_risk_kpis', function (Blueprint $table) {
            $table->dropIndex('qmr_risk_kpis_status_created_at_idx');
        });

        Schema::table('qmr_risk_registers', function (Blueprint $table) {
            $table->dropIndex('qmr_risk_registers_created_at_idx');
            $table->dropIndex('qmr_risk_registers_issue_level_idx');
            $table->dropIndex('qmr_risk_registers_process_name_idx');
            $table->dropIndex('qmr_risk_registers_improvement_level_idx');
        });
    }
};
