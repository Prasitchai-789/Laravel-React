<?php

namespace App\Http\Controllers;

use App\Models\CarUse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UserCarUsageExport;

class UserCarUsageReportController extends Controller
{
    /**
     * Export user car usage report to Excel.
     */
    public function export(Request $request)
    {
        $year = $request->input('year', Carbon::now()->year);
        $month = $request->input('month', Carbon::now()->month);
        
        return Excel::download(new UserCarUsageExport($year, $month), 'user-car-usage-report.xlsx');
    }

    /**
     * Display the user car usage report page.
     */
    public function index()
    {
        return Inertia::render('CarUsage/UserReport');
    }

    /**
     * Get car usage data by user for API.
     *
     * Logic: For each user (user_request -> Webapp_Emp.EmpID), find:
     * - Total trips
     * - Total distance
     * - First and last usage date
     */
    public function apiData(Request $request)
    {
        $year = $request->input('year', Carbon::now()->year);
        $month = $request->input('month', Carbon::now()->month);

        // Get start and end of month
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        // Get unique user_request with usage in this month
        $userUsages = CarUse::select('user_request')
            ->selectRaw('MIN(created_at) as first_date')
            ->selectRaw('MAX(created_at) as last_date')
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('SUM(CAST(ISNULL(NULLIF(use_distance, \'\'), \'0\') AS INT)) as total_distance')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->whereNotNull('user_request')
            ->where('user_request', '!=', '')
            ->groupBy('user_request')
            ->get();

        // Get employee info from Webapp_Emp (sqlsrv2)
        $empIds = $userUsages->pluck('user_request')->filter()->unique()->toArray();
        
        $employees = [];
        if (!empty($empIds)) {
            $employees = DB::connection('sqlsrv2')
                ->table('Webapp_Emp')
                ->whereIn('EmpID', $empIds)
                ->get()
                ->keyBy('EmpID');
        }

        // Process each user usage
        $result = $userUsages->map(function ($usage) use ($employees) {
            $empId = $usage->user_request;
            $employee = $employees[$empId] ?? null;

            // Get employee details
            $empName = $employee->EmpName ?? $employee->FullName ?? 'ไม่ระบุ';
            $empDept = $employee->DeptName ?? $employee->Department ?? '-';
            $empPosition = $employee->Position ?? $employee->PositionName ?? '-';

            return [
                'emp_id' => $empId,
                'emp_name' => $empName,
                'emp_dept' => $empDept,
                'emp_position' => $empPosition,
                'trip_count' => (int) $usage->trip_count,
                'total_distance' => (int) $usage->total_distance,
                'first_date' => $usage->first_date ? Carbon::parse($usage->first_date)->format('Y-m-d H:i') : null,
                'last_date' => $usage->last_date ? Carbon::parse($usage->last_date)->format('Y-m-d H:i') : null,
            ];
        })->sortByDesc('total_distance')->values();

        // Summary statistics
        $summary = [
            'total_users' => $result->count(),
            'total_trips' => $result->sum('trip_count'),
            'total_distance' => $result->sum('total_distance'),
        ];

        return response()->json([
            'success' => true,
            'year' => (int) $year,
            'month' => (int) $month,
            'data' => $result,
            'summary' => $summary,
        ]);
    }
}
