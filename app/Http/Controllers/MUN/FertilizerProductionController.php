<?php

namespace App\Http\Controllers\MUN;

use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\MUN\FertilizerLine;
use App\Models\MUN\FertilizerLabor;
use App\Http\Controllers\Controller;
use App\Models\MUN\FertilizerProduction;
use App\Models\MUN\FertilizerEnergyUsage;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Notifications\TelegramService;

class FertilizerProductionController extends Controller
{
    public function index()
    {
        $productions = FertilizerProduction::with('line', 'labors')->latest()->get();
        $lines = FertilizerLine::all();
        $labors = FertilizerLabor::all();
        $energies = FertilizerEnergyUsage::all();

        return Inertia::render('MUN/FertilizerProductions/Index', [
            'productions' => $productions,
            'lines' => $lines,
            'labors' => $labors,
            'energies' => $energies,
        ]);
    }

    public function apiIndex()
    {
        $productions = FertilizerProduction::with('line')->latest()->get();
        $lines = FertilizerLine::all();
        $labors = FertilizerLabor::all();
        $energies = FertilizerEnergyUsage::all();

        return response()->json([
            'productions' => $productions,
            'lines' => $lines,
            'labors' => $labors,
            'energies' => $energies,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'shift' => 'required|string|in:กลางวัน,กลางคืน',
                'line_id' => 'required|exists:fertilizer_lines,id',
                'product_qty' => 'required|numeric|min:0',
                'target_qty' => 'required|numeric|min:0',
                'workers' => 'required|numeric|min:0',
                'hours' => 'required|numeric|min:0',
                'ot_hours' => 'required|numeric|min:0',
                'palm_fiber' => 'required|numeric|min:0',
                'number_kwh' => 'required|numeric|min:0'
            ]);

            $production = FertilizerProduction::create($validated);

            $labor = FertilizerLabor::create([
                'production_id' => $production->id,
                'workers' => $validated['workers'],
                'hours' => $validated['hours'],
                'ot_hours' => $validated['ot_hours'],
                'labor_cost' => 0,
            ]);

            $lastEnergy = FertilizerEnergyUsage::latest()->first();

            $oldKwh = $lastEnergy?->number_kwh ?? 0; // ถ้ายังไม่มี record ให้เป็น 0

            $energy = FertilizerEnergyUsage::create([
                'production_id'   => $production->id,
                'number_kwh'      => $validated['number_kwh'],   // ค่าที่ผู้ใช้กรอกใหม่
                'electricity_kwh' => $validated['number_kwh'] - $oldKwh, // หักออกจากค่าเก่า
                'cost'            => $validated['palm_fiber'],
                'fuel_litre'      => 0,
            ]);


            $Telegram = new TelegramService();

            $message = "
                📦 *Production Record Updated*
                -----------------------------------
                🗓️ วันที่: {$validated['date']}
                🌔 กะ: {$validated['shift']}
                🏭 ไลน์ผลิต: ID {$validated['line_id']}
                ⚙️ ปริมาณผลิตจริง: {$validated['product_qty']} ตัน
                🎯 เป้าหมาย: {$validated['target_qty']} ตัน
                👷‍♂️ พนักงาน: {$validated['workers']} คน
                ⏱️ ชั่วโมงทำงาน: {$validated['hours']} ชม.
                💡 พลังงานไฟฟ้า: {$validated['number_kwh']} kWh
                -----------------------------------
                ✅ บันทึกข้อมูลสำเร็จโดยระบบ Fertilizer Production
                ";

            $Telegram->sendToTelegramFER($message);

            return redirect()->back()->with('message', 'Production created successfully');
        } catch (ValidationException $ve) {
            return redirect()->back()->withErrors($ve->errors())->withInput();
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, FertilizerProduction $fertilizerProduction)
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'shift' => 'required|string|in:กลางวัน,กลางคืน',
                'line_id' => 'required|exists:fertilizer_lines,id',
                'product_qty' => 'required|numeric|min:0',
                'target_qty' => 'required|numeric|min:0',
                'workers' => 'required|numeric|min:0',
                'hours' => 'required|numeric|min:0',
                'ot_hours' => 'required|numeric|min:0',
                'palm_fiber' => 'required|numeric|min:0',
                'number_kwh' => 'required|numeric|min:0'
            ]);


            $fertilizerProduction->update($validated);

            FertilizerLabor::where('production_id', $fertilizerProduction->id)->update([
                'workers' => $validated['workers'],
                'hours' => $validated['hours'],
                'ot_hours' => $validated['ot_hours'],
                'labor_cost' => 0,
            ]);

            $yesterday = Carbon::parse($fertilizerProduction->date)->subDay()->toDateString();

            $energy = FertilizerEnergyUsage::where('production_id', $fertilizerProduction->id)
                ->whereDate('created_at', $yesterday) // หรือใช้ column วันที่จริง เช่น 'date'
                ->first();

            if ($energy) {
                $oldKwh = $energy->number_kwh;
                $energy->update([
                    'number_kwh'      => $validated['number_kwh'],
                    'electricity_kwh' => $validated['number_kwh'] - $oldKwh,
                    'cost'            => $validated['palm_fiber'],
                    'fuel_litre'      => 0,
                ]);
            } else {
                // ถ้าไม่มี record เก่า ให้สร้างใหม่
                FertilizerEnergyUsage::create([
                    'production_id'   => $fertilizerProduction->id,
                    'number_kwh'      => $validated['number_kwh'],
                    'electricity_kwh' => $validated['number_kwh'], // เพราะไม่มีค่าเก่า
                    'cost'            => $validated['palm_fiber'],
                    'fuel_litre'      => 0,
                ]);
            }


            // $Telegram = new TelegramService();
            // $Telegram->sendToTelegramITE('Production updated successfully');


            return redirect()->back()->with('message', 'Production updated successfully');
        } catch (ValidationException $ve) {
            return redirect()->back()->withErrors($ve->errors())->withInput();
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(FertilizerProduction $fertilizerProduction)
    {
        $fertilizerProduction->delete();

        return response()->json([
            'message' => 'Production deleted successfully',
        ]);
    }
}
