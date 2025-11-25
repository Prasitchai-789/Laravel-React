<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SeederStatus;
class SeederStatusController extends Controller
{

       public function update(Request $request, $userId)
    {
        $request->validate([
            'received_items' => 'array',
            'received_items.*' => 'in:1,2,3'
        ]);

        $status = SeederStatus::updateOrCreate(
            ['user_id' => $userId],
            ['received_items' => $request->received_items ?? []]
        );

        return response()->json([
            'message' => 'อัพเดทสถานะสำเร็จ',
            'status' => $status->load('user')
        ]);
    }

    public function addItem($userId, $itemId)
    {
        $status = SeederStatus::firstOrCreate(['user_id' => $userId]);
        $status->addItem($itemId)->save();

        return response()->json([
            'message' => 'เพิ่มไอเทมสำเร็จ',
            'status' => $status->load('user')
        ]);
    }
}
