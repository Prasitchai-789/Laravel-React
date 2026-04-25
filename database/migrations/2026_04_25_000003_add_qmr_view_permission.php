<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        DB::table('permissions')->updateOrInsert(
            ['name' => 'qmr.view', 'guard_name' => 'web'],
            ['created_at' => now(), 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        if (!Schema::hasTable('permissions')) {
            return;
        }

        DB::table('permissions')
            ->where('name', 'qmr.view')
            ->where('guard_name', 'web')
            ->delete();
    }
};
