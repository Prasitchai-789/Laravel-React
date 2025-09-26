<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('movement_type', function (Blueprint $table) {
            $table->id('movement_type_id');
            $table->string('movement_type_name', 50);
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });

        // ใส่ค่าตัวอย่าง
        DB::table('movement_type')->insert([
            ['movement_type_name' => 'IN', 'description' => 'รับเข้า stock', 'created_at' => now(), 'updated_at' => now()],
            ['movement_type_name' => 'OUT', 'description' => 'เบิกออก / ขาย', 'created_at' => now(), 'updated_at' => now()],
            ['movement_type_name' => 'ADJ', 'description' => 'ปรับปรุง stock (+/-)', 'created_at' => now(), 'updated_at' => now()],
            ['movement_type_name' => 'RETURN', 'description' => 'คืนสินค้า', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('movement_type');
    }
};
