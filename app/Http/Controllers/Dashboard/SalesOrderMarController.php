<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SalesOrderMarController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/MAR/SalesOrderMarReport', []);
    }
}
