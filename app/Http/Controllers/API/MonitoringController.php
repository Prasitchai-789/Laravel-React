<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Device;
use App\Models\ChecklistLog;
use App\Jobs\ProcessDeviceMetrics;

class MonitoringController extends Controller
{
    public function reportMetrics(Request $request)
    {
        $data = $request->validate([
            'mac_address' => 'required|string',
            'cpu' => 'numeric',
            'ram' => 'numeric',
            'disk' => 'numeric',
        ]);

        // Dispatch to Queue for High Performance
        ProcessDeviceMetrics::dispatch($data);

        return response()->json(['status' => 'queued']);
    }

    public function getOverview()
    {
        $total = Device::count();
        $online = Device::where('status', 'online')->count();
        
        return response()->json([
            'total' => $total,
            'online' => $online,
            'offline' => $total - $online
        ]);
    }

    public function getMapData()
    {
        $devices = Device::with('location')->whereNotNull('location_id')->get();
        return response()->json($devices);
    }

    public function getDevices()
    {
        return response()->json(Device::with('location')->get());
    }

    public function getDeviceDetail($id)
    {
        $device = Device::with(['metrics' => function($q) {
            $q->latest()->take(50); // Last 50 metrics for graph
        }, 'logs', 'checklistLogs.item'])->findOrFail($id);

        return response()->json($device);
    }

    public function submitChecklist(Request $request)
    {
        $data = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'items' => 'required|array',
            'checked_by' => 'required|string'
        ]);

        foreach ($data['items'] as $item) {
            ChecklistLog::create([
                'device_id' => $data['device_id'],
                'checklist_item_id' => $item['id'],
                'status' => $item['status'],
                'note' => $item['note'] ?? null,
                'checked_by' => $data['checked_by'],
                'checked_at' => now()
            ]);
        }

        return response()->json(['success' => true]);
    }
}
