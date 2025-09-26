<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StoreFreshSeeder extends Seeder
{
    public function run(): void
    {
        // ปิด foreign key check (สำหรับ MySQL)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // ล้างตาราง
        DB::table('store_order_items')->truncate();
        DB::table('store_orders')->truncate();
        DB::table('store_movements')->truncate();

        // เปิด foreign key check
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // (ถ้าต้องการ) เพิ่มข้อมูลเริ่มต้น
        DB::table('store_movements')->insert([
            [
                'type' => 'adjustment',
                'category' => 'stock',
                'quantity' => 0,
                'note' => 'เริ่มต้น',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // เพิ่ม orders/items เริ่มต้นได้ตามต้องการ
    }
}
