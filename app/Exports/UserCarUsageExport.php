<?php

namespace App\Exports;

use App\Models\CarUse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class UserCarUsageExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize
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

        $result = $userUsages->map(function ($usage) use ($employees) {
            $empId = $usage->user_request;
            $employee = $employees[$empId] ?? null;

            $empName = $employee->EmpName ?? $employee->FullName ?? 'ไม่ระบุ';
            $empDept = $employee->DeptName ?? $employee->Department ?? '-';
            $empPosition = $employee->Position ?? $employee->PositionName ?? '-';

            return [
                'emp_name' => $empName,
                'emp_dept' => $empDept,
                'emp_position' => $empPosition,
                'trip_count' => (int) $usage->trip_count,
                'total_distance' => number_format((int) $usage->total_distance),
                'first_date' => $usage->first_date ? Carbon::parse($usage->first_date)->format('d/m/Y H:i') : '-',
                'last_date' => $usage->last_date ? Carbon::parse($usage->last_date)->format('d/m/Y H:i') : '-',
            ];
        })->sortByDesc('total_distance')->values();

        // Add index number
        $finalData = [];
        foreach ($result as $index => $row) {
            $finalData[] = [
                $index + 1,
                $row['emp_name'],
                $row['emp_dept'],
                $row['emp_position'],
                $row['trip_count'],
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
            'ชื่อพนักงาน',
            'แผนก',
            'ตำแหน่ง',
            'จำนวนเที่ยว',
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
