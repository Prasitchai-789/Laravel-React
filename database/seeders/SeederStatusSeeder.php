<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeederStatusSeeder extends Seeder
{
    public function run(): void
    {
        DB::connection('sqlsrv')->table('seeder_status')->insert([
            ['name' => 'รับเสื้อ'],
            ['name' => 'รับหมวก'],
            ['name' => 'รับเสื้อสีขาว'],
        ]);
    }
}
