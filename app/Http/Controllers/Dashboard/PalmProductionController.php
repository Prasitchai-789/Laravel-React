<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PalmProductionController extends Controller
{
    public function index()
{
    $summary = [
        'purchase_volume' => 120,
        'purchase_amount' => 450000,
        'avg_price' => 3750,
        'remaining_volume' => 300,
        'carry_over' => 100,
        'truck_count' => 25,
        'production_volume' => 90,
    ];

    $production = [
        ['name' => 'น้ำมันปาล์มดิบ', 'volume' => 16.2, 'percent' => 18],
        ['name' => 'เมล็ดในปาล์ม', 'volume' => 4.5, 'percent' => 5],
        ['name' => 'กะลาปาล์ม', 'volume' => 4.5, 'percent' => 5],
        ['name' => 'ทะลายปาล์มเปล่า', 'volume' => 17.1, 'percent' => 19],
    ];

    $dailyData = [
        ['date' => '1', 'volume' => 20],
        ['date' => '2', 'volume' => 15],
        ['date' => '3', 'volume' => 30],
        ['date' => '4', 'volume' => 25],
        ['date' => '5', 'volume' => 25],
        ['date' => '6', 'volume' => 25],
        ['date' => '7', 'volume' => 25],
        ['date' => '8', 'volume' => 25],
        ['date' => '9', 'volume' => 25],
    ];

    $monthlyData = [
        ['month' => 'ม.ค.', 'production' => 500, 'expected' => 520],
        ['month' => 'ก.พ.', 'production' => 450, 'expected' => 480],
        ['month' => 'มี.ค.', 'production' => 600, 'expected' => 590],
    ];

    return Inertia::render('Productions/Index', [
        'summary' => $summary,
        'production' => $production,
        'dailyData' => $dailyData,
        'monthlyData' => $monthlyData,
    ]);
}

}
