<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_orders', function (Blueprint $table) {
            // เพิ่มคอลัมน์ user_approved เป็น nullable
            $table->string('user_approved')->nullable()->after('some_existing_column');
            // เปลี่ยน 'some_existing_column' เป็นชื่อคอลัมน์ที่ต้องการให้คอลัมน์นี้มาอยู่หลัง
        });
    }

    public function down(): void
    {
        Schema::table('store_orders', function (Blueprint $table) {
            $table->dropColumn('user_approved');
        });
    }
};
