<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CpoReferenceSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ Density Reference Table
        $densityData = [
            [20, 0.9107], [21, 0.9100], [22, 0.9094], [23, 0.9087],
            [24, 0.9080], [25, 0.9074], [26, 0.9067], [27, 0.9060],
            [28, 0.9054], [29, 0.9047], [30, 0.9041], [31, 0.9034],
            [32, 0.9027], [33, 0.9021], [34, 0.9014], [35, 0.9007],
            [36, 0.9001], [37, 0.8994], [38, 0.8987], [39, 0.8981],
            [40, 0.8979], [41, 0.8967], [42, 0.8961], [43, 0.8954],
            [44, 0.8947], [45, 0.8941], [46, 0.8934], [47, 0.8927],
            [48, 0.8921], [49, 0.8914], [50, 0.8908], [51, 0.8901],
            [52, 0.8894], [53, 0.8888], [54, 0.8881], [55, 0.8874],
            [56, 0.8868], [57, 0.8861], [58, 0.8854], [59, 0.8848],
            [60, 0.8841], [61, 0.8834], [62, 0.8828], [63, 0.8821],
            [64, 0.8814], [65, 0.8808], [66, 0.8801], [67, 0.8794],
            [68, 0.8788], [69, 0.8781], [70, 0.8775], [71, 0.8768],
        ];

        foreach ($densityData as [$temp, $density]) {
            DB::table('cpo_density_refs')->insert([
                'temperature_c' => $temp,
                'density' => $density,
            ]);
        }

        // ✅ Tank Information
        $tankData = [
            ['tank_no' => 1, 'height_m' => 10.720, 'diameter_m' => 3.78,  'volume_m3' => 120.5100],
            ['tank_no' => 2, 'height_m' => 15.400, 'diameter_m' => 9.68,  'volume_m3' => 1123.2800],
            ['tank_no' => 3, 'height_m' => 15.500, 'diameter_m' => 9.68,  'volume_m3' => 1130.5700],
            ['tank_no' => 4, 'height_m' => 11.140, 'diameter_m' => 16.48, 'volume_m3' => 2399.9600],
        ];

        DB::table('cpo_tank_infos')->insert($tankData);
    }
}
