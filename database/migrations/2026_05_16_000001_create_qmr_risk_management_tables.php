<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qmr_risk_registers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('document_type')->default('แบบฟอร์ม');
            $table->string('document_code', 50)->default('FM-QMR-61-0023');
            $table->date('effective_date')->nullable();
            $table->string('revision_no', 20)->default('04');
            $table->string('document_title')->default('การประเมินความเสี่ยงและโอกาสด้านคุณภาพ');
            $table->string('issue_type', 100)->nullable();
            $table->string('consideration', 255);
            $table->string('stakeholder', 255)->nullable();
            $table->text('expectation');
            $table->text('impact')->nullable();
            $table->string('risk_category', 80)->nullable();
            $table->string('process_name', 255)->nullable();
            $table->string('owner_name', 255)->nullable();
            $table->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('risk_likelihood')->default(1);
            $table->unsignedTinyInteger('risk_impact')->default(1);
            $table->unsignedSmallInteger('risk_score')->default(1);
            $table->string('risk_level', 1)->default('L');
            $table->unsignedTinyInteger('improvement_likelihood')->default(1);
            $table->unsignedTinyInteger('improvement_impact')->default(1);
            $table->unsignedSmallInteger('improvement_score')->default(1);
            $table->string('improvement_level', 1)->default('L');
            $table->string('status', 50)->default('active');
            $table->date('review_due_date')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['risk_level', 'status']);
            $table->index(['risk_category', 'risk_level']);
            $table->index('review_due_date');
        });

        Schema::create('qmr_risk_kpis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_register_id')->constrained('qmr_risk_registers')->cascadeOnDelete();
            $table->string('code', 50)->nullable()->unique();
            $table->string('name');
            $table->string('threshold')->nullable();
            $table->string('unit', 50)->nullable();
            $table->string('direction', 20)->default('higher_better');
            $table->decimal('target_value', 15, 4)->nullable();
            $table->decimal('warning_value', 15, 4)->nullable();
            $table->decimal('critical_value', 15, 4)->nullable();
            $table->string('green_criteria')->nullable();
            $table->string('yellow_criteria')->nullable();
            $table->string('red_criteria')->nullable();
            $table->decimal('current_value', 15, 4)->nullable();
            $table->decimal('target_percent', 6, 2)->default(0);
            $table->string('status', 50)->default('in_progress');
            $table->date('measured_at')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['risk_register_id', 'status']);
            $table->index('measured_at');
        });

        Schema::create('qmr_risk_kpi_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_kpi_id')->constrained('qmr_risk_kpis')->cascadeOnDelete();
            $table->date('measured_date');
            $table->decimal('value', 15, 4);
            $table->decimal('target_percent', 6, 2)->default(0);
            $table->string('status', 50)->default('in_progress');
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['risk_kpi_id', 'measured_date']);
            $table->index(['measured_date', 'status']);
        });

        Schema::create('qmr_risk_controls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_register_id')->constrained('qmr_risk_registers')->cascadeOnDelete();
            $table->foreignId('risk_kpi_id')->nullable()->constrained('qmr_risk_kpis')->nullOnDelete();
            $table->string('code', 50)->nullable()->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 50)->default('active');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->string('responsible_name', 255)->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['risk_register_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        Schema::create('qmr_risk_control_followups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_control_id')->constrained('qmr_risk_controls')->cascadeOnDelete();
            $table->date('followup_date');
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->string('status', 50)->default('active');
            $table->text('result')->nullable();
            $table->foreignId('followed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['followup_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qmr_risk_control_followups');
        Schema::dropIfExists('qmr_risk_controls');
        Schema::dropIfExists('qmr_risk_kpi_measurements');
        Schema::dropIfExists('qmr_risk_kpis');
        Schema::dropIfExists('qmr_risk_registers');
    }
};
