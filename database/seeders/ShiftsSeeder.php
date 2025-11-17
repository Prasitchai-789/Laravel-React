<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShiftsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shifts = [
            [
                'shift_number' => 1,
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'total_hours' => 9,
                'name' => 'shift_a',
                'description' => 'Day shift 08:00-17:00'
            ],
            [
                'shift_number' => 2,
                'start_time' => '08:00:00',
                'end_time' => '16:00:00',
                'total_hours' => 8,
                'name' => 'shift_b',
                'description' => 'Regular shift 08:00-16:00'
            ],
            [
                'shift_number' => 3,
                'start_time' => '16:00:00',
                'end_time' => '00:00:00',
                'total_hours' => 8,
                'name' => 'shift_c',
                'description' => 'Afternoon shift 16:00-00:00'
            ],
            [
                'shift_number' => 4,
                'start_time' => '20:00:00',
                'end_time' => '04:00:00',
                'total_hours' => 8,
                'name' => 'shift_d',
                'description' => 'Night shift 20:00-04:00'
            ],
            [
                'shift_number' => 5,
                'start_time' => '00:00:00',
                'end_time' => '08:00:00',
                'total_hours' => 8,
                'name' => 'shift_e',
                'description' => 'Night shift 00:00-08:00'
            ]
        ];

        DB::table('shifts')->insert($shifts);
    }
}
