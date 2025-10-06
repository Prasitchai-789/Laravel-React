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

    public function indexPage()
    {
        // ดึง movements จาก MySQL
        $movements = \App\Models\StoreMovement::select(
            'store_movements.id',
            'store_movements.quantity',
            'store_movements.type',
            'store_movements.movement_type',
            'store_movements.category',
            'store_movements.note',
            'store_movements.status',
            'store_movements.created_at',
            'store_items.good_id as goodCode',
            'store_items.good_code as goodCodeStore',
            'users.name as userName',
            'users.employee_id'
        )
            ->leftJoin('store_items', 'store_movements.store_item_id', '=', 'store_items.id')
            ->leftJoin('users', 'store_movements.user_id', '=', 'users.id')
            ->orderByDesc('store_movements.created_at')
            ->get();

        // ✅ ดึง employee_id ทั้งหมด (ที่ไม่ว่าง)
        $employeeIds = $movements->pluck('employee_id')->filter()->unique()->toArray();

        // ✅ ดึงชื่อจริง EmpName จาก SQL Server ครั้งเดียว
        $employees = DB::connection('sqlsrv2')
            ->table('dbo.Webapp_Emp')
            ->whereIn('EmpID', $employeeIds)
            ->pluck('EmpName', 'EmpID'); // key = EmpID, value = EmpName

        // ✅ ดึงชื่อสินค้าจาก SQL Server (เหมือนเดิม)
        $goodCodes = $movements->pluck('goodCodeStore')->unique()->toArray();

        $emGoods = \App\Models\WIN\EMGood::on('sqlsrv2')
            ->whereIn('GoodCode', $goodCodes)
            ->get()
            ->keyBy('GoodCode');

        // ✅ map รวมข้อมูลทั้งหมด
        $movementsData = $movements->map(function ($m) use ($emGoods, $employees) {
            $goodName = $emGoods[$m->goodCodeStore]->GoodName1 ?? '-';
            $empName = $employees[$m->employee_id] ?? $m->userName ?? '-';

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
                'user' => $empName, // 👈 ใช้ชื่อพนักงานจริงจาก Webapp_Emp ถ้ามี
                'note' => $m->note,
                'status' => $m->status,
            ];
        });

        return Inertia::render('Store/StoreMovement', [
            'title' => 'การเคลื่อนไหวของสินค้า',
            'movements' => $movementsData,
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

        $userId = auth()->id(); // ใช้ session auth
        $movements = [];

        // ฟังก์ชันช่วยสร้าง movement
        $createMovement = function ($category, $quantity, $type) use ($request, $userId, &$movements, $storeItem) {
            $movements[] = \App\Models\StoreMovement::create([
                'store_item_id' => $storeItem->id, // ใช้ id จริง
                'movement_type' => 'adjustment',
                'category' => $category,
                'type' => $type,
                'quantity' => $quantity,
                'note' => $request->note ?? '',
                'user_id' => $userId,
                'status' => 'approved',
            ]);
        };

        // dd($createMovement);
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
