<?php

namespace App\Http\Controllers\ERP;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\WIN\WebappDept;
use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;

class ERPController extends Controller
{

    public function index(Request $request)
    {
        // รับค่าจาก query parameters
        $perPage = $request->get('per_page', 10);
        $page = $request->get('page', 1);
        $search = $request->get('search', '');
        $department = $request->get('department', 'ทั้งหมด');

        // สร้าง query พื้นฐาน
        $query = WebappEmp::with('webDept')
            ->whereNotNull('EmpCode')
            ->orderBy('EmpCode', 'asc');

        // ค้นหาด้วยคำค้นหา
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('EmpName', 'like', "%{$search}%")
                    ->orWhere('EmpCode', 'like', "%{$search}%")
                    ->orWhere('Position', 'like', "%{$search}%")
                    ->orWhereHas('webDept', function ($q) use ($search) {
                        $q->where('DeptName', 'like', "%{$search}%");
                    });
            });
        }

        // กรองตามแผนก
        if ($department !== 'ทั้งหมด') {
            $query->whereHas('webDept', function ($q) use ($department) {
                $q->where('DeptName', $department);
            });
        }

        $employees = $query->paginate($perPage, ['EmpID', 'EmpCode', 'EmpName', 'Position', 'DeptID'], 'page', $page);

        // จัดรูปแบบข้อมูลก่อนส่งไป frontend
        $formattedEmployees = $employees->through(function ($emp) {
            return [
                'EmpID' => $emp->EmpID,
                'EmpCode' => $emp->EmpCode,
                'EmpName' => $emp->EmpName,
                'Position' => $emp->Position,
                'DeptName' => $emp->webDept->DeptName ?? '-',
            ];
        });

        // ดึงรายการแผนกทั้งหมดสำหรับ dropdown
        $departments = WebappEmp::with('webDept')
            ->whereNotNull('EmpCode')
            ->get()
            ->pluck('webDept.DeptName')
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('ERP/Index/ERPIndex', [
            'employees' => $formattedEmployees,
            'departments' => $departments,
            'filters' => array_merge([
                'per_page' => 10,
                'page' => 1,
                'search' => '',
                'department' => 'ทั้งหมด',
                'status' => 'ทั้งหมด',
                'shift' => 'ทั้งหมด',
                'date' => ''
            ], $request->only(['per_page', 'page', 'search', 'department', 'status', 'shift', 'date'])),
        ]);
    }




    public function Dashboard()
    {

        return Inertia::render('ERP/ERPDashboard');
    }
    public function Detail()
    {



        return Inertia::render('ERP/ERPDetail');
    }
    public function ImportExcel()
    {



        return Inertia::render('ERP/ImportExcel/ImportExcel');
    }
    // app/Http/Controllers/ERP/ShiftController.php

    public function shifts()
    {
        $shifts = Shift::with(['department', 'holidays'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($shift) {

                // ดึง shift_assignments จาก sqlsrv2
                $assignments = \DB::connection('sqlsrv')->table('shift_assignments')
                    ->where('shift_id', $shift->id)
                    ->get();

                // ดึง employee จริงจาก sqlsrv2
                $employees = \DB::connection('sqlsrv2')->table('Webapp_Emp')
                    ->whereIn('EmpID', $assignments->pluck('employee_id'))
                    ->get();

                // แปลงเวลาและคำนวณ totalHours
                $startTime = \Carbon\Carbon::parse($shift->start_time);
                $endTime = \Carbon\Carbon::parse($shift->end_time);

                // ตรวจสอบกะข้ามวัน (end < start)
                if ($endTime->lessThan($startTime)) {
                    $endTime->addDay();
                }

                // คำนวณชั่วโมงและนาที
                $minutes = $startTime->diffInMinutes($endTime);
                $hours = floor($minutes / 60);
                $mins = $minutes % 60;
                $totalHours = sprintf("%d.%02d", $hours, $mins); // แสดงเป็น ชั่วโมง.นาที เช่น 1.20

                return [
                    'id' => $shift->id,
                    'shiftNumber' => $shift->shift_number,
                    'shiftName' => $shift->name,
                    'startTime' => $startTime->format('H:i'),
                    'endTime' => $endTime->format('H:i'),
                    'totalHours' => $totalHours,
                    'description' => $shift->description,
                    'status' => $shift->status ?? 'active',
                    'department' => $shift->department?->DeptID,
                    'departmentName' => $shift->department?->DeptName ?? '',
                    'employees' => $employees->count(),
                    'holidays' => $shift->holidays->map(fn($h) => [
                        'id' => $h->id,
                        'name' => $h->name,
                        'date' => $h->date,
                    ])->toArray(),
                    'timeRange' => $this->getTimeRange($shift->start_time, $shift->end_time),
                    'overtimeAllowed' => $shift->overtime_allowed ?? false,
                ];
            });

        // dd($shifts);

        return Inertia::render('ERP/Shifts/Shifts', [
            'shifts' => $shifts,
        ]);
    }







    // ตัวอย่าง getTimeRange
    private function getTimeRange($startTime, $endTime)
    {
        $hour = (int) substr($startTime, 0, 2);

        if ($hour >= 6 && $hour < 14) {
            return 'กลางวัน';
        } elseif ($hour >= 14 && $hour < 22) {
            return 'บ่ายถึงดึก';
        } else {
            return 'ดึกถึงเช้า';
        }
    }



    public function overtime()
    {



        return Inertia::render('ERP/Overtime/Overtime');
    }
}
