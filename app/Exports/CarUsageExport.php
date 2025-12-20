<?php

namespace App\Exports;

use App\Models\CarUse;
use App\Models\CarReport;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CarUsageExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize
{
    protected $year;
    protected $month;

    public function __construct($year, $month)
    {
        $this->year = $year;
        $this->month = $month;
    }

    public function array(): array
    {
        $startOfMonth = Carbon::create($this->year, $this->month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($this->year, $this->month, 1)->endOfMonth();

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

        $result = $carUsages->map(function ($usage) use ($startOfMonth, $endOfMonth, $carReports, $provinces) {
            $carId = $usage->car_id;
            $carReport = $carReports->get((int) $carId);

            // Get first record of the month
            $firstRecord = CarUse::where('car_id', $carId)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->whereNotNull('use_start')
                ->where('use_start', '!=', '')
                ->orderBy('created_at', 'asc')
                ->first();

            // Get last record of the month
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

            // Get province name
            $provinceName = '';
            if ($carCounty && isset($provinces[$carCounty])) {
                $provinceName = $provinces[$carCounty]->ProvinceName;
            } else if ($carCounty) {
                $provinceData = DB::connection('sqlsrv2')
                    ->table('Webapp_City')
                    ->where('ProvinceID', $carCounty)
                    ->orWhere('ProvinceName', 'like', "%{$carCounty}%")
                    ->first();
                $provinceName = $provinceData?->ProvinceName ?? $carCounty;
            }

            return [
                'car_number' => $carNumber,
                'province_name' => $provinceName,
                'car_brand' => $carReport?->car_brand ?? '-',
                'car_model' => $carReport?->car_model ?? '-',
                'trip_count' => $usage->trip_count,
                'mileage_start' => number_format($mileageStart),
                'mileage_end' => number_format($mileageEnd),
                'total_distance' => number_format($totalDistance),
                'first_date' => $firstRecord?->created_at?->format('d/m/Y H:i') ?? '-',
                'last_date' => $lastRecord?->created_at?->format('d/m/Y H:i') ?? '-',
            ];
        })->sortByDesc('total_distance')->values();

        // Add index number
        $finalData = [];
        foreach ($result as $index => $row) {
            $finalData[] = [
                $index + 1,
                $row['car_number'],
                $row['province_name'],
                $row['car_brand'],
                $row['car_model'],
                $row['trip_count'],
                $row['mileage_start'],
                $row['mileage_end'],
                $row['total_distance'],
                $row['first_date'],
                $row['last_date'],
            ];
        }

        return $finalData;
    }

    public function headings(): array
    {
        return [
            'ลำดับ',
            'หมายเลขรถ',
            'จังหวัด',
            'ยี่ห้อ',
            'รุ่น',
            'จำนวนเที่ยว',
            'เลขไมล์เริ่มต้น',
            'เลขไมล์สิ้นสุด',
            'ระยะทางรวม (กม.)',
            'วันที่เริ่มใช้งาน',
            'วันที่ใช้งานล่าสุด',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
