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
 
    public function getProductionReportApi(Request $request)
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
 
        $data = $this->service->getProductionReportData($startDate, $endDate);
 
        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
 
    public function getSOPlanApi(Request $request)
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
 
        $data = $this->service->getSOPlanData($startDate, $endDate);
 
        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
}
