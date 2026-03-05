<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Chemical;

class ChemicalSeeder extends Seeder
{
    public function run(): void
    {
        $chemicals = [
            ['name' => 'ดินขาว', 'unit' => 'กก.'],
            ['name' => 'Fogon 3000', 'unit' => 'กก.'],
            ['name' => 'Hexon 4000', 'unit' => 'กก.'],
            ['name' => 'Sumalchlor 50', 'unit' => 'กก.'],
            ['name' => 'PROXITANE', 'unit' => 'กก.'],
            ['name' => 'Polymer', 'unit' => 'กก.'],
            ['name' => 'Soda Ash', 'unit' => 'กก.'],
            ['name' => 'Salt', 'unit' => 'กก.'],
            ['name' => 'HURRICANE ACH 23KH', 'unit' => 'กก.'],
        ];

        foreach ($chemicals as $chemical) {
            Chemical::firstOrCreate(
                ['name' => $chemical['name']],
                ['unit' => $chemical['unit']]
            );
        }
    }
}
