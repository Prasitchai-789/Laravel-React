<?php
 
namespace App\Http\Controllers\Dashboard;
 
use App\Http\Controllers\Controller;
use App\Services\Dashboard\ExecutiveProductionService;
use Illuminate\Http\Request;
 
class ExecutiveProductionController extends Controller
{
    protected $service;
 
    public function __construct(ExecutiveProductionService $service)
    {
        $this->service = $service;
    }
 
    public function index()
    {
        return \Inertia\Inertia::render('Dashboard/ExecutiveProductionReport');
    }
}
