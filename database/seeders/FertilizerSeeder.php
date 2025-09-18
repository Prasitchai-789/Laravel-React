<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MUN\FertilizerLine;
use App\Models\MUN\FertilizerIssue;
use App\Models\MUN\FertilizerLabor;
use App\Models\MUN\FertilizerMachine;
use App\Models\MUN\FertilizerMaterial;
use App\Models\MUN\FertilizerSupplier;
use App\Models\MUN\FertilizerProduction;
use App\Models\MUN\FertilizerEnergyUsage;
use App\Models\MUN\FertilizerMachineDowntime;
use App\Models\MUN\FertilizerRawMaterialUsage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class FertilizerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Suppliers
        $supplier1 = FertilizerSupplier::create(['name'=>'Supplier A', 'contact_info'=>'099-111-2222']);
        $supplier2 = FertilizerSupplier::create(['name'=>'Supplier B', 'contact_info'=>'099-333-4444']);

        // Lines
        $line1 = FertilizerLine::create(['name'=>'Line 1', 'location'=>'Building A']);
        $line2 = FertilizerLine::create(['name'=>'Line 2', 'location'=>'Building B']);

        // Materials
        $mat1 = FertilizerMaterial::create(['name'=>'Urea','unit'=>'kg','supplier_id'=>$supplier1->id]);
        $mat2 = FertilizerMaterial::create(['name'=>'NPK','unit'=>'kg','supplier_id'=>$supplier2->id]);

        // Machines
        $machine1 = FertilizerMachine::create(['name'=>'Mixer','line_id'=>$line1->id,'depreciation_rate'=>0.05]);
        $machine2 = FertilizerMachine::create(['name'=>'Granulator','line_id'=>$line1->id,'depreciation_rate'=>0.04]);

        // Productions
        $prod1 = FertilizerProduction::create([
            'date' => '2025-09-15',
            'shift' => 'A',
            'line_id' => $line1->id,
            'product_qty' => 1000,
            'target_qty' => 1200
        ]);

        // Raw Material Usage
        FertilizerRawMaterialUsage::create([
            'production_id' => $prod1->id,
            'material_id' => $mat1->id,
            'qty_used' => 500,
            'unit_cost' => 15,
            'total_cost' => 500*15
        ]);

        FertilizerRawMaterialUsage::create([
            'production_id' => $prod1->id,
            'material_id' => $mat2->id,
            'qty_used' => 300,
            'unit_cost' => 20,
            'total_cost' => 300*20
        ]);

        // Energy Usage
        FertilizerEnergyUsage::create([
            'production_id' => $prod1->id,
            'electricity_kwh' => 200,
            'fuel_litre' => 50,
            'cost' => 200*4 + 50*30
        ]);

        // Labor
        FertilizerLabor::create([
            'production_id' => $prod1->id,
            'workers' => 5,
            'hours' => 8,
            'ot_hours' => 2,
            'labor_cost' => 5*8*100 + 5*2*150
        ]);

        // Machine Downtime
        FertilizerMachineDowntime::create([
            'machine_id' => $machine1->id,
            'production_id' => $prod1->id,
            'reason' => 'Maintenance',
            'duration' => 30,
            'cost' => 50
        ]);

        // Issue
        FertilizerIssue::create([
            'production_id' => $prod1->id,
            'issue_type' => 'Material',
            'description' => 'Delayed delivery',
            'duration' => 60,
            'status' => 'open'
        ]);
    }

}
