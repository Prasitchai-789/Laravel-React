<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_account_categories', function (Blueprint $table) {
            $table->id();
            $table->string('acc_code', 50)->unique();
            $table->string('acc_name')->nullable();
            $table->string('category');
            $table->string('type', 20)->default('expense');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'is_active']);
            $table->index('category');
        });

        $defaults = [
            ['acc_code' => '513001', 'category' => 'ซื้อผลปาล์มทะลาย', 'sort_order' => 10],
            ['acc_code' => '515101', 'category' => 'เงินเดือน', 'sort_order' => 20],
            ['acc_code' => '522001', 'category' => 'เงินเดือน', 'sort_order' => 21],
            ['acc_code' => '515103', 'category' => 'เงินเดือน', 'sort_order' => 22],
            ['acc_code' => '515102', 'category' => 'เงินเดือน', 'sort_order' => 23],
            ['acc_code' => '522003', 'category' => 'เงินเดือน', 'sort_order' => 24],
            ['acc_code' => '515104', 'category' => 'เงินเดือน', 'sort_order' => 25],
            ['acc_code' => '515202', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 30],
            ['acc_code' => '150401', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 31],
            ['acc_code' => '515201', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 32],
            ['acc_code' => '150402', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 33],
            ['acc_code' => '515212', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 34],
            ['acc_code' => '515213', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 35],
            ['acc_code' => '515302', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 36],
            ['acc_code' => '515303', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 37],
            ['acc_code' => '515305', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 38],
            ['acc_code' => '515304', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 39],
            ['acc_code' => '515401', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 40],
            ['acc_code' => '515403', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 41],
            ['acc_code' => '515404', 'category' => 'ค่าใช้จ่ายส่วน โรงงาน', 'sort_order' => 42],
            ['acc_code' => '523033', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 50],
            ['acc_code' => '521005', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 51],
            ['acc_code' => '523029', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 52],
            ['acc_code' => '523032', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 53],
            ['acc_code' => '523023', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 54],
            ['acc_code' => '523015', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 55],
            ['acc_code' => '515503', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 56],
            ['acc_code' => '524003', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 57],
            ['acc_code' => '150502', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 58],
            ['acc_code' => '524005', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 59],
            ['acc_code' => '150501', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 60],
            ['acc_code' => '524002', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 61],
            ['acc_code' => '524004', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 62],
            ['acc_code' => '523001', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 63],
            ['acc_code' => '523002', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 64],
            ['acc_code' => '523005', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 65],
            ['acc_code' => '515501', 'category' => 'ค่าใช้จ่ายส่วน สำนักงาน', 'sort_order' => 66],
            ['acc_code' => '522006', 'category' => 'สวัสดิการ', 'sort_order' => 70],
            ['acc_code' => '522009', 'category' => 'สวัสดิการ', 'sort_order' => 71],
            ['acc_code' => '522008', 'category' => 'สวัสดิการ', 'sort_order' => 72],
            ['acc_code' => '522007', 'category' => 'สวัสดิการ', 'sort_order' => 73],
            ['acc_code' => '522010', 'category' => 'สวัสดิการ', 'sort_order' => 74],
            ['acc_code' => '522011', 'category' => 'สวัสดิการ', 'sort_order' => 75],
            ['acc_code' => '522013', 'category' => 'สวัสดิการ', 'sort_order' => 76],
            ['acc_code' => '523031', 'category' => 'ค่าบริการกุศล', 'sort_order' => 80],
            ['acc_code' => '523006', 'category' => 'ค่าใช้จ่ายในการเดินทาง', 'sort_order' => 90],
            ['acc_code' => '523011', 'category' => 'ค่าใช้จ่ายในการเดินทาง', 'sort_order' => 91],
            ['acc_code' => '523007', 'category' => 'ค่าใช้จ่ายในการเดินทาง', 'sort_order' => 92],
            ['acc_code' => '523008', 'category' => 'ค่าใช้จ่ายในการเดินทาง', 'sort_order' => 93],
            ['acc_code' => '523010', 'category' => 'ค่าใช้จ่ายในการเดินทาง', 'sort_order' => 94],
            ['acc_code' => '523009', 'category' => 'ค่าใช้จ่ายในการเดินทาง', 'sort_order' => 95],
            ['acc_code' => '526002', 'category' => 'ค่าประกันภัย', 'sort_order' => 100],
            ['acc_code' => '526004', 'category' => 'ค่าประกันภัย', 'sort_order' => 101],
            ['acc_code' => '515208', 'category' => 'ค่าประกันภัย', 'sort_order' => 102],
            ['acc_code' => '524007', 'category' => 'ค่าซ่อมแซมบำรุงรักษาและค่าภาษี - รถยนต์', 'sort_order' => 110],
            ['acc_code' => '526003', 'category' => 'ค่าซ่อมแซมบำรุงรักษาและค่าภาษี - รถยนต์', 'sort_order' => 111],
            ['acc_code' => '527003', 'category' => 'ค่าซ่อมแซมบำรุงรักษาและค่าภาษี - รถยนต์', 'sort_order' => 112],
            ['acc_code' => '540001', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 120],
            ['acc_code' => '523026', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 121],
            ['acc_code' => '523019', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 122],
            ['acc_code' => '523025', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 123],
            ['acc_code' => '527008', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 124],
            ['acc_code' => '527001', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 125],
            ['acc_code' => '527006', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 126],
            ['acc_code' => '527004', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 127],
            ['acc_code' => '523030', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 128],
            ['acc_code' => '523013', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 129],
            ['acc_code' => '523022', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 130],
            ['acc_code' => '53600-04', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 131],
            ['acc_code' => '523014', 'category' => 'ค่าบริการ ดอกเบี้ย', 'sort_order' => 132],
            ['acc_code' => '515220', 'category' => 'ค่าใช้จ่าย อื่นๆ', 'sort_order' => 140],
            ['acc_code' => '159001', 'category' => 'ค่าใช้จ่าย อื่นๆ', 'sort_order' => 141],
            ['acc_code' => '521003', 'category' => 'ค่าใช้จ่าย อื่นๆ', 'sort_order' => 142],
            ['acc_code' => '523034', 'category' => 'ค่าใช้จ่าย อื่นๆ', 'sort_order' => 143],
            ['acc_code' => '527009', 'category' => 'อื่นๆ', 'type' => 'other', 'sort_order' => 150],
        ];

        $now = now();
        DB::table('financial_account_categories')->insert(array_map(
            fn ($row) => array_merge([
                'acc_name' => null,
                'type' => 'expense',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ], $row),
            $defaults
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_account_categories');
    }
};
