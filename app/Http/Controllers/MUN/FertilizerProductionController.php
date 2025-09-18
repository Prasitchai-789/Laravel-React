<?php

namespace App\Http\Controllers\MUN;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\MUN\FertilizerLine;
use App\Http\Controllers\Controller;
use App\Models\MUN\FertilizerProduction;

class FertilizerProductionController extends Controller
{
    public function index()
    {
        $productions = FertilizerProduction::with('line')->latest()->get();
        $lines = FertilizerLine::all();
        return Inertia::render('MUN/FertilizerProductions/Index', [
            'productions' => $productions,
            'lines' => $lines
        ]);
    }

    public function create()
    {
        $lines = FertilizerLine::all();
        return Inertia::render('MUN/FertilizerProductions/Create', [
            'lines' => $lines
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date'=>'required|date',
            'shift'=>'required|string',
            'line_id'=>'required|exists:fertilizer_lines,id',
            'product_qty'=>'nullable|numeric',
            'target_qty'=>'nullable|numeric'
        ]);

        FertilizerProduction::create($data);
        return redirect()->route('fertilizer-productions.index')->with('success', 'Production added.');
    }

    public function edit(FertilizerProduction $fertilizerProduction)
    {
        $lines = FertilizerLine::all();
        return Inertia::render('MUN/FertilizerProductions/Edit', [
            'production' => $fertilizerProduction,
            'lines' => $lines
        ]);
    }

    public function update(Request $request, FertilizerProduction $fertilizerProduction)
    {
        $data = $request->validate([
            'date'=>'required|date',
            'shift'=>'required|string',
            'line_id'=>'required|exists:fertilizer_lines,id',
            'product_qty'=>'nullable|numeric',
            'target_qty'=>'nullable|numeric'
        ]);

        $fertilizerProduction->update($data);
        return redirect()->route('fertilizer-productions.index')->with('success', 'Production updated.');
    }

    public function destroy(FertilizerProduction $fertilizerProduction)
    {
        $fertilizerProduction->delete();
        return redirect()->route('fertilizer-productions.index')->with('success', 'Production deleted.');
    }
}
