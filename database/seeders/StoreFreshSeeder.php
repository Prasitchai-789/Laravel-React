<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StoreFreshSeeder extends Seeder
{
    public function run(): void
    {
        // 🔹 ปิด foreign key constraints ชั่วคราว (SQL Server)
        DB::statement('ALTER TABLE store_order_items NOCHECK CONSTRAINT ALL');
        DB::statement('ALTER TABLE store_movements NOCHECK CONSTRAINT ALL');

        // 🔹 ล้างข้อมูล
        DB::table('store_order_items')->truncate();
        DB::table('store_movements')->truncate();
        DB::table('store_orders')->truncate();

        // 🔹 เปิด foreign key constraints กลับ
        DB::statement('ALTER TABLE store_order_items CHECK CONSTRAINT ALL');
        DB::statement('ALTER TABLE store_movements CHECK CONSTRAINT ALL');

    }
}
