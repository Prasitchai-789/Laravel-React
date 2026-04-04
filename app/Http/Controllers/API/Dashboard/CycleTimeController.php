<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Production\CycleTimeService;
use Illuminate\Http\Request;

class CycleTimeController extends Controller
{
    protected $cycleTimeService;

    public function __construct(CycleTimeService $cycleTimeService)
    {
        $this->cycleTimeService = $cycleTimeService;
    }

    public function index(Request $request)
    {
        try {
            $date = $request->query('date');
            $data = $this->cycleTimeService->getCycleTimeAnalytics($date);

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
