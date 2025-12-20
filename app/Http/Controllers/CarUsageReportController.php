<?php

namespace App\Http\Controllers;

use App\Models\CarUse;
use App\Models\CarReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class CarUsageReportController extends Controller
{
    /**
     * Display the car usage report page.
     */
    public function index()
    {
        return Inertia::render('CarUsage/Index');
    }

    /**
     * Get car usage data for API.
     *
     * Logic: For each vehicle (car_id -> car_reports.id), find:
     * - First use_start of the month (earliest record)
     * - Last use_end of the month (latest record)
     * - Distance = Last use_end - First use_start
     */
    public function apiData(Request $request)
    {
        $year = $request->input('year', Carbon::now()->year);
        $month = $request->input('month', Carbon::now()->month);

        // Get start and end of month
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        // Get province names from Webapp_City (sqlsrv2)
        $provinces = DB::connection('sqlsrv2')
            ->table('Webapp_City')
            ->select('ProvinceID', 'ProvinceName')
            ->distinct()
            ->get()
            ->keyBy('ProvinceID');

        // Get unique car_ids with usage in this month
        $carUsages = CarUse::select('car_id')
            ->selectRaw('MIN(created_at) as first_date')
            ->selectRaw('MAX(created_at) as last_date')
            ->selectRaw('COUNT(*) as trip_count')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->whereNotNull('car_id')
            ->where('car_id', '!=', '')
            ->groupBy('car_id')
            ->get();

        // Get all car reports for the used cars
        $carIds = $carUsages->pluck('car_id')->filter()->unique()->toArray();
        $carReports = CarReport::whereIn('id', $carIds)->get()->keyBy('id');

        // Process each car usage
        $result = $carUsages->map(function ($usage) use ($startOfMonth, $endOfMonth, $carReports, $provinces) {
            $carId = $usage->car_id;
            $carReport = $carReports->get((int) $carId);

            // Get first record of the month (for use_start)
            $firstRecord = CarUse::where('car_id', $carId)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->whereNotNull('use_start')
                ->where('use_start', '!=', '')
                ->orderBy('created_at', 'asc')
                ->first();

            // Get last record of the month (for use_end) - only completed trips (use_status = 2)
            $lastRecord = CarUse::where('car_id', $carId)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->whereNotNull('use_end')
                ->where('use_end', '!=', '')
                ->orderBy('created_at', 'desc')
                ->first();

            $mileageStart = $firstRecord ? (int) $firstRecord->use_start : 0;
            $mileageEnd = $lastRecord ? (int) $lastRecord->use_end : 0;
            $totalDistance = max(0, $mileageEnd - $mileageStart);

            // Build car name with province
            $carNumber = $carReport?->car_number ?? 'ไม่ระบุ';
            $carCounty = $carReport?->car_county ?? '';

            // Get province name from Webapp_City
            $provinceName = '';
            if ($carCounty && isset($provinces[$carCounty])) {
                $provinceName = $provinces[$carCounty]->ProvinceName;
            } else if ($carCounty) {
                // Try to find by matching county code
                $provinceData = DB::connection('sqlsrv2')
                    ->table('Webapp_City')
                    ->where('ProvinceID', $carCounty)
                    ->orWhere('ProvinceName', 'like', "%{$carCounty}%")
                    ->first();
                $provinceName = $provinceData?->ProvinceName ?? $carCounty;
            }

            $fullCarName = trim("{$carNumber} {$provinceName}");

            return [
                'car_id' => $carId,
                'car_number' => $carNumber,
                'province_name' => $provinceName,
                'full_car_name' => $fullCarName,
                'car_brand' => $carReport?->car_brand ?? '-',
                'car_model' => $carReport?->car_model ?? '-',
                'trip_count' => $usage->trip_count,
                'first_date' => $firstRecord?->created_at?->format('Y-m-d H:i'),
                'last_date' => $lastRecord?->created_at?->format('Y-m-d H:i'),
                'mileage_start' => $mileageStart,
                'mileage_end' => $mileageEnd,
                'total_distance' => $totalDistance,
            ];
        })->sortByDesc('total_distance')->values();

        // Summary statistics
        $summary = [
            'total_vehicles' => $result->count(),
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
