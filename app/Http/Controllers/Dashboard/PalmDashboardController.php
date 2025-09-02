<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PalmDashboardController extends Controller
{
    public function index()
    {
        // ข้อมูลตัวอย่าง - ในโปรดักชันควรดึงจากโมเดลจริง
        $summary = [
            'total' => 1220.76,
            'pending' => 345.42,
            'recent_purchase' => 875.34,
            'recent_production' => 492.76
        ];

        $products = [
            [
                'product' => 'น้ำมันปาล์มสกัด',
                'carrying_balance' => null,
                'production' => 52264,
                'sales' => 65100,
                'balance' => 'คำนวณจากฐานข้อมูล'
            ],
            [
                'product' => 'แบล็คโมปาส์ม',
                'carrying_balance' => null,
                'production' => 13766,
                'sales' => 31410,
                'balance' => 'คำนวณจากฐานข้อมูล'
            ],
            // ... ข้อมูลอื่นๆ
        ];

        $pendingPalm = [199.77, 200.76, 100.76, 199.77];

        return Inertia::render('RPO/PalmDashboard', [
            'summary' => $summary,
            'products' => $products,
            'monthlyProducts' => $products, // ตัวอย่างใช้ข้อมูลเดียวกัน
            'pendingPalm' => $pendingPalm
        ]);
    }
}
