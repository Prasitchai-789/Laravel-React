<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CCTV\Dvr;

class CctvSeeder extends Seeder
{
    public function run(): void
    {
        $dvrs = [
            ['name' => 'DVR1', 'cameras' => 16],
            ['name' => 'DVR2', 'cameras' => 32],
            ['name' => 'DVR3', 'cameras' => 16],
        ];

        foreach ($dvrs as $dvrData) {
            Dvr::firstOrCreate(
                ['name' => $dvrData['name']],
                ['camera_count' => $dvrData['cameras']]
            );
        }
    }
}
