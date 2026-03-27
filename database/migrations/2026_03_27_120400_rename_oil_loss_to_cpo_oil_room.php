<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename oil_loss to cpo_oil_room
        DB::statement('EXEC sp_rename \'cpo_data.oil_loss\', \'cpo_oil_room\', \'COLUMN\'');
    }

    public function down(): void
    {
        DB::statement('EXEC sp_rename \'cpo_data.cpo_oil_room\', \'oil_loss\', \'COLUMN\'');
    }
};
