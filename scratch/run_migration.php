<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$sql = [
    'create table "qmr_risk_registers" ("id" bigint not null identity primary key, "code" nvarchar(50) not null, "document_type" nvarchar(255) not null default \'แบบฟอร์ม\', "document_code" nvarchar(50) not null default \'FM-QMR-61-0023\', "effective_date" date null, "revision_no" nvarchar(20) not null default \'04\', "document_title" nvarchar(255) not null default \'การประเมินความเสี่ยงและโอกาสด้านคุณภาพ\', "issue_type" nvarchar(100) null, "consideration" nvarchar(255) not null, "stakeholder" nvarchar(255) null, "expectation" nvarchar(max) not null, "impact" nvarchar(max) null, "risk_category" nvarchar(80) null, "process_name" nvarchar(255) null, "owner_name" nvarchar(255) null, "owner_user_id" bigint null, "risk_likelihood" tinyint not null default \'1\', "risk_impact" tinyint not null default \'1\', "risk_score" smallint not null default \'1\', "risk_level" nvarchar(1) not null default \'L\', "improvement_likelihood" tinyint not null default \'1\', "improvement_impact" tinyint not null default \'1\', "improvement_score" smallint not null default \'1\', "improvement_level" nvarchar(1) not null default \'L\', "status" nvarchar(50) not null default \'active\', "review_due_date" date null, "created_by" bigint null, "updated_by" bigint null, "created_at" datetime null, "updated_at" datetime null, "deleted_at" datetime null)',
    'alter table "qmr_risk_registers" add constraint "qmr_risk_registers_owner_user_id_foreign" foreign key ("owner_user_id") references "users" ("id") on delete set null',
    'alter table "qmr_risk_registers" add constraint "qmr_risk_registers_created_by_foreign" foreign key ("created_by") references "users" ("id") on delete set null',
    'alter table "qmr_risk_registers" add constraint "qmr_risk_registers_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on delete set null',
    'create index "qmr_risk_registers_risk_level_status_index" on "qmr_risk_registers" ("risk_level", "status")',
    'create index "qmr_risk_registers_risk_category_risk_level_index" on "qmr_risk_registers" ("risk_category", "risk_level")',
    'create index "qmr_risk_registers_review_due_date_index" on "qmr_risk_registers" ("review_due_date")',
    'create unique index "qmr_risk_registers_code_unique" on "qmr_risk_registers" ("code")',
    'create table "qmr_risk_kpis" ("id" bigint not null identity primary key, "risk_register_id" bigint not null, "code" nvarchar(50) null, "name" nvarchar(255) not null, "threshold" nvarchar(255) null, "unit" nvarchar(50) null, "direction" nvarchar(20) not null default \'higher_better\', "target_value" decimal(15, 4) null, "warning_value" decimal(15, 4) null, "critical_value" decimal(15, 4) null, "green_criteria" nvarchar(255) null, "yellow_criteria" nvarchar(255) null, "red_criteria" nvarchar(255) null, "current_value" decimal(15, 4) null, "target_percent" decimal(6, 2) not null default \'0\', "status" nvarchar(50) not null default \'in_progress\', "measured_at" date null, "note" nvarchar(max) null, "created_by" bigint null, "updated_by" bigint null, "created_at" datetime null, "updated_at" datetime null, "deleted_at" datetime null)',
    'alter table "qmr_risk_kpis" add constraint "qmr_risk_kpis_risk_register_id_foreign" foreign key ("risk_register_id") references "qmr_risk_registers" ("id") on delete cascade',
    'alter table "qmr_risk_kpis" add constraint "qmr_risk_kpis_created_by_foreign" foreign key ("created_by") references "users" ("id") on delete set null',
    'alter table "qmr_risk_kpis" add constraint "qmr_risk_kpis_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on delete set null',
    'create index "qmr_risk_kpis_risk_register_id_status_index" on "qmr_risk_kpis" ("risk_register_id", "status")',
    'create index "qmr_risk_kpis_measured_at_index" on "qmr_risk_kpis" ("measured_at")',
    'create unique index "qmr_risk_kpis_code_unique" on "qmr_risk_kpis" ("code")',
    'create table "qmr_risk_kpi_measurements" ("id" bigint not null identity primary key, "risk_kpi_id" bigint not null, "measured_date" date not null, "value" decimal(15, 4) not null, "target_percent" decimal(6, 2) not null default \'0\', "status" nvarchar(50) not null default \'in_progress\', "note" nvarchar(max) null, "created_by" bigint null, "created_at" datetime null, "updated_at" datetime null)',
    'alter table "qmr_risk_kpi_measurements" add constraint "qmr_risk_kpi_measurements_risk_kpi_id_foreign" foreign key ("risk_kpi_id") references "qmr_risk_kpis" ("id") on delete cascade',
    'alter table "qmr_risk_kpi_measurements" add constraint "qmr_risk_kpi_measurements_created_by_foreign" foreign key ("created_by") references "users" ("id") on delete set null',
    'create unique index "qmr_risk_kpi_measurements_risk_kpi_id_measured_date_unique" on "qmr_risk_kpi_measurements" ("risk_kpi_id", "measured_date")',
    'create index "qmr_risk_kpi_measurements_measured_date_status_index" on "qmr_risk_kpi_measurements" ("measured_date", "status")',
    'create table "qmr_risk_controls" ("id" bigint not null identity primary key, "risk_register_id" bigint not null, "risk_kpi_id" bigint null, "code" nvarchar(50) null, "name" nvarchar(255) not null, "description" nvarchar(max) null, "status" nvarchar(50) not null default \'active\', "progress_percent" tinyint not null default \'0\', "responsible_name" nvarchar(255) null, "responsible_user_id" bigint null, "start_date" date null, "due_date" date null, "note" nvarchar(max) null, "created_by" bigint null, "updated_by" bigint null, "created_at" datetime null, "updated_at" datetime null, "deleted_at" datetime null)',
    'alter table "qmr_risk_controls" add constraint "qmr_risk_controls_risk_register_id_foreign" foreign key ("risk_register_id") references "qmr_risk_registers" ("id") on delete cascade',
    'alter table "qmr_risk_controls" add constraint "qmr_risk_controls_risk_kpi_id_foreign" foreign key ("risk_kpi_id") references "qmr_risk_kpis" ("id") on delete set null',
    'alter table "qmr_risk_controls" add constraint "qmr_risk_controls_responsible_user_id_foreign" foreign key ("responsible_user_id") references "users" ("id") on delete set null',
    'alter table "qmr_risk_controls" add constraint "qmr_risk_controls_created_by_foreign" foreign key ("created_by") references "users" ("id") on delete set null',
    'alter table "qmr_risk_controls" add constraint "qmr_risk_controls_updated_by_foreign" foreign key ("updated_by") references "users" ("id") on delete set null',
    'create index "qmr_risk_controls_risk_register_id_status_index" on "qmr_risk_controls" ("risk_register_id", "status")',
    'create index "qmr_risk_controls_due_date_status_index" on "qmr_risk_controls" ("due_date", "status")',
    'create unique index "qmr_risk_controls_code_unique" on "qmr_risk_controls" ("code")',
    'create table "qmr_risk_control_followups" ("id" bigint not null identity primary key, "risk_control_id" bigint not null, "followup_date" date not null, "progress_percent" tinyint not null default \'0\', "status" nvarchar(50) not null default \'active\', "result" nvarchar(max) null, "followed_by" bigint null, "created_at" datetime null, "updated_at" datetime null)',
    'alter table "qmr_risk_control_followups" add constraint "qmr_risk_control_followups_risk_control_id_foreign" foreign key ("risk_control_id") references "qmr_risk_controls" ("id") on delete cascade',
    'alter table "qmr_risk_control_followups" add constraint "qmr_risk_control_followups_followed_by_foreign" foreign key ("followed_by") references "users" ("id") on delete set null',
    'create index "qmr_risk_control_followups_followup_date_status_index" on "qmr_risk_control_followups" ("followup_date", "status")',
    "insert into [migrations] ([migration], [batch]) values ('2026_05_16_000001_create_qmr_risk_management_tables', (select max([batch]) + 1 from [migrations]))"
];

foreach ($sql as $query) {
    echo "Executing: " . substr($query, 0, 100) . "...\n";
    try {
        DB::unprepared($query);
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
echo "Done.\n";
