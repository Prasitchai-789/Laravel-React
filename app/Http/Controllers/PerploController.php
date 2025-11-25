<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PerploController extends Controller
{
    public function index()
    {
        return Inertia::render('Populations/PreploIndex/PreploIndex');
    }
}
