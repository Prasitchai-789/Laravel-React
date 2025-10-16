<?php

namespace App\Http\Controllers\Store;


use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\StoreItem;
use App\Models\WIN\EMGood;
use Illuminate\Http\Request;
use App\Models\StoreMovement;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;


class StoreMovementController extends Controller
{

    public function indexPage(Request $request)
    {
        $search = mb_strtolower(trim($request->input('search', '')));
        $perPage = 20; // จำนวนต่อหน้า สามารถปรับได้
        $page = $request->input('page', 1);

        // Query หลัก
        $query = \App\Models\StoreMovement::select(
            'store_movements.id',
            'store_movements.quantity',
            'store_movements.type',
            'store_movements.movement_type',
            'store_movements.category',
            'store_movements.note',
            'store_movements.status',
            'store_movements.created_at',
            'store_movements.updated_at',
            'store_items.good_id as goodCode',
            'store_items.good_code as goodCodeStore',
            'users.name as userName',
            'users.employee_id'
        )
            ->leftJoin('store_items', 'store_movements.store_item_id', '=', 'store_items.id')
            ->leftJoin('users', 'store_movements.user_id', '=', 'users.id')
            ->where('store_movements.status', '!=', 'rejected')
            ->orderByDesc('store_movements.id');

        // Filter search (SQL side)
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(store_items.good_code) LIKE ?', ["%{$search}%"]);
                // GoodName1 จะ filter หลัง map เพราะอยู่ DB อื่น
            });
        }

        $movements = $query->paginate($perPage, ['*'], 'page', $page);

        // ดึง employee name จาก SQL Server
        $employeeIds = $movements->pluck('employee_id')->filter()->unique()->toArray();
        $employees = DB::connection('sqlsrv2')
            ->table('dbo.Webapp_Emp')
            ->whereIn('EmpID', $employeeIds)
            ->pluck('EmpName', 'EmpID');

        // ดึง GoodName จาก EMGood
        $goodCodes = $movements->pluck('goodCodeStore')->unique()->toArray();
        $emGoods = \App\Models\WIN\EMGood::on('sqlsrv2')
            ->whereIn('GoodCode', $goodCodes)
            ->get()
            ->keyBy('GoodCode');

        // Map data สำหรับส่งไป Inertia
        $movementsData = $movements->map(function ($m) use ($emGoods, $employees, $search) {
            $goodName = $emGoods[$m->goodCodeStore]->GoodName1 ?? '-';
            $empName = $employees[$m->employee_id] ?? $m->userName ?? '-';

            // Filter GoodName ถ้ามี search
            if (!empty($search)) {
                if (
                    !str_contains(mb_strtolower($goodName), $search) &&
                    !str_contains(mb_strtolower($m->goodCodeStore ?? ''), $search)
                ) {
                    return null;
                }
            }

            return [
                'id' => $m->id,
                'goodCode' => $m->goodCode,
                'goodCodeStore' => $m->goodCodeStore,
                'goodName' => $goodName,
                'stockQty' => $m->quantity,
                'type' => $m->type,
                'movement_type' => $m->movement_type,
                'category' => $m->category,
                'date' => $m->created_at->format('Y-m-d'),
                'created_at' => $m->created_at->format('Y-m-d'),
                'user' => $empName,
                'note' => $m->note,
                'status' => $m->status,
            ];
        })->filter()->values(); // filter null ออก

        return Inertia::render('Store/StoreMovement', [
            'title' => 'การเคลื่อนไหวของสินค้า',
            'movements' => $movementsData,
            'pagination' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ]
        ]);
    }

    // สร้าง movement ใหม่
    public function stock(Request $request)
    {
        // หา store item ตาม good_code
        $storeItem = \App\Models\StoreItem::where('good_code', $request->store_item_code)->first();

        if (!$storeItem) {
            return response()->json([
                'message' => 'ไม่พบสินค้านี้ในระบบ',
            ], 404);
        }

        // Validation
        $request->validate([
            'store_item_code' => 'required|exists:store_items,good_code',
            'note' => 'nullable|string',
            'stock_qty' => 'nullable|numeric|min:0.01',
            'stock_type' => 'nullable|in:add,subtract',
            'safety_stock' => 'nullable|numeric|min:0.01',
            'safety_type' => 'nullable|in:add,subtract',
        ]);

        $userId = auth()->id();
        $movements = [];

        // ฟังก์ชันช่วยสร้าง movement
        $createMovement = function ($category, $quantity, $type) use ($request, $userId, &$movements, $storeItem) {
            $movements[] = \App\Models\StoreMovement::create([
                'store_item_id' => $storeItem->id,
                'movement_type' => 'adjustment',
                'category' => $category,
                'type' => $type,
                'quantity' => $quantity,
                'note' => $request->note ?? '',
                'user_id' => $userId,
                'status' => 'approved',
            ]);
        };

        // สร้าง stock movement
        if ($request->filled('stock_qty') && $request->stock_type) {
            $createMovement('stock', $request->stock_qty, $request->stock_type);
        }

        // สร้าง safety movement
        if ($request->filled('safety_stock') && $request->safety_type) {
            $createMovement('safety', $request->safety_stock, $request->safety_type);
        }

        // dd($movements);
        return redirect()->back()->with('success', 'บันทึก movement เรียบร้อยแล้ว');
    }

}
