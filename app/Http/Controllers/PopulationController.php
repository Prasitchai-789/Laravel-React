<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class PopulationController extends Controller
{
    public function index()
    {
        return Inertia::render('Populations/Index');
    }
}
