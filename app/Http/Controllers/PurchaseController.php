<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function index()
    {
        $users = User::all();
        return Inertia::render('RPO/Index', [
            'data' => $users,
        ]);
    }
}
