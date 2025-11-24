<?php

namespace App\Http\Controllers\WO;

use Illuminate\Http\Request;

use App\Http\Controllers\Controller;
use App\Models\WIN\WebappEmp;
use App\Models\WebappWorkOrder;
use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;

class WorkOrderController extends Controller
{
    public function index()
    {
        // ดึงข้อมูลจาก SQL Server (sqlsrv2) เรียงตาม Date ล่าสุด และ TypeWork = 1
        $workOrders = WebappWorkOrder::where('TypeWork', 1)
            ->orderBy('Date', 'desc')
            ->get();

        // ส่งข้อมูลไปยัง React ผ่าน Inertia
        return Inertia::render('WO/WOIndex', [
            'workOrders' => $workOrders
        ]);
    }
    public function Order(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 50);
            $page = $request->input('page', 1);

            $searchTerm = trim($request->input('search', ''));
            $filterStatus = trim($request->input('status', ''));
            $filterCategory = trim($request->input('category', ''));

            $query = DB::connection('sqlsrv2')
                ->table('asset_information as a')
                // LEFT JOIN กับ Webapp_computers เฉพาะ asset_type = 'Computer'
                ->leftJoin('Webapp_computers as c', function ($join) {
                    $join->on('a.asset_name', '=', 'c.code_com')
                        ->where('a.asset_type', '=', 'Computer');
                })
                ->select(
                    'a.id',
                    'a.asset_id',
                    'a.asset_name',
                    'a.asset_type',
                    'a.owner as requester',
                    'a.location',
                    'a.asset_model as model',
                    'a.serial_number',
                    'a.acquisition_date',
                    'a.status as asset_status',
                    'a.estimated_value',
                    'a.cia_rating',
                    'a.additional_details as purpose',
                    'a.record_responsible as assignee',
                    'a.remarks as note',
                    'a.image_path',
                    'a.created_at',
                    'a.updated_at',
                    'c.cpu',
                    'c.ram',
                    'c.storage',
                    'c.os',
                    'c.status as computer_status',
                    'c.office',
                    'c.monitor',
                    'c.service_tag',
                    'c.graphic'
                );

            //---------------------------------------
            // 🔍 Search Filter
            //---------------------------------------
            if ($searchTerm !== '') {
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('a.asset_id', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.asset_name', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.owner', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.location', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.asset_model', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.serial_number', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.additional_details', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.record_responsible', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('a.remarks', 'LIKE', "%{$searchTerm}%");
                });
            }

            //---------------------------------------
            // 🗂 Category Filter
            //---------------------------------------
            if ($filterCategory !== '' && $filterCategory !== 'ทั้งหมด') {
                $query->where('a.asset_type', 'LIKE', "%{$filterCategory}%");
            }

            //---------------------------------------
            // 🔥 Status Filter
            //---------------------------------------
            if ($filterStatus !== '' && $filterStatus !== 'ทั้งหมด') {
                $statusValue = (int)$filterStatus;
                if (in_array($statusValue, [1, 2, 3])) {
                    $query->where(function ($q) use ($statusValue) {
                        $q->where('a.status', '=', $statusValue)
                            ->orWhere(function ($qc) use ($statusValue) {
                                $qc->whereNotNull('c.code_com')
                                    ->where('c.status', '=', $statusValue);
                            });
                    });
                }
            }

            //---------------------------------------
            // Sort
            //---------------------------------------
            $query->orderBy('a.id', 'desc');

            //---------------------------------------
            // Pagination
            //---------------------------------------
            $orders = $query->paginate($perPage, ['*'], 'page', $page);


            //---------------------------------------
            // Transform Result
            //---------------------------------------
            $transformedOrders = collect($orders->items())->map(function ($order) {
                $statusValue = $order->asset_status;
                if (!empty($order->computer_status)) {
                    $statusValue = $order->computer_status;
                }

                $statusNum = (int)$statusValue;
                switch ($statusNum) {
                    case 1:
                        $status = 'พร้อมใช้งาน';
                        break;
                    case 2:
                        $status = 'ใช้งานอยู่';
                        break;
                    case 3:
                        $status = 'ไม่พร้อมใช้งาน';
                        break;
                    default:
                        $status = 'ไม่พร้อมใช้งาน';
                        break;
                }

                return [
                    'id' => $order->id,
                    'asset_id' => $order->asset_id,
                    'asset_name' => $order->asset_name,
                    'asset_type' => $order->asset_type,
                    'requester' => $order->requester,
                    'location' => $order->location,
                    'model' => $order->model,
                    'serial_number' => $order->serial_number,
                    'acquisition_date' => $order->acquisition_date,
                    'asset_status' => $order->asset_status,
                    'estimated_value' => $order->estimated_value,
                    'cia_rating' => $order->cia_rating,
                    'purpose' => $order->purpose,
                    'assignee' => $order->assignee,
                    'note' => $order->note,
                    'image_path' => $order->image_path,
                    'created_at' => $order->created_at,
                    'updated_at' => $order->updated_at,
                    'cpu' => $order->cpu,
                    'ram' => $order->ram,
                    'storage' => $order->storage,
                    'os' => $order->os,
                    'computer_status' => $order->computer_status,
                    'office' => $order->office,
                    'monitor' => $order->monitor,
                    'service_tag' => $order->service_tag,
                    'graphic' => $order->graphic,
                    'status_display' => $status,
                    'category_display' => $order->asset_type ?? 'อุปกรณ์ไอที'
                ];
            });

            //---------------------------------------
            // ส่ง Filter กลับ
            //---------------------------------------
            $filters = [];
            if ($searchTerm !== '') $filters['search'] = $searchTerm;
            if ($filterStatus !== '' && $filterStatus !== 'ทั้งหมด') $filters['status'] = $filterStatus;
            if ($filterCategory !== '' && $filterCategory !== 'ทั้งหมด') $filters['category'] = $filterCategory;

            //---------------------------------------
            // Return
            //---------------------------------------
            //  dd($transformedOrders);
            return Inertia::render('WO/OrderIT/OrderIndex', [
                'orders' => $transformedOrders,
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'from' => $orders->firstItem(),
                    'to' => $orders->lastItem(),
                ],
                'filters' => $filters
            ]);
        } catch (\Exception $e) {
            \Log::error('IT Order Error: ' . $e->getMessage());
            \Log::error('IT Order Trace: ' . $e->getTraceAsString());

            return Inertia::render('WO/OrderIT/OrderIndex', [
                'orders' => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 10,
                    'total' => 0,
                    'from' => 0,
                    'to' => 0,
                ],
                'filters' => [],
                'error' => 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' . $e->getMessage()
            ]);
        }
    }
}
