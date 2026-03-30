<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Device;
use App\Models\ChecklistLog;
use App\Jobs\ProcessDeviceMetrics;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MonitoringController extends Controller
{
    public function reportMetrics(Request $request)
    {
        if (!\Illuminate\Support\Facades\Cache::get('monitoring_active', true)) {
            return response()->json(['status' => 'disabled'], 503);
        }

        \Log::info('Agent Report Hit:', $request->all());

        $data = $request->validate([
            'mac_address' => 'required|string',
            'cpu' => 'numeric',
            'ram' => 'numeric',
            'disk' => 'numeric',
            'ip_address' => 'nullable|string'
        ]);

        // Smart IP detection: Use payload IP, fallback to request IP
        $detectedIp = $request->ip_address ?? $request->ip();
        
        // If it's localhost (127.0.0.1) but we have a better IP from the request, use it.
        if ($detectedIp === '127.0.0.1' || $detectedIp === '::1') {
            $detectedIp = $request->ip();
        }

        $data['ip_address'] = $detectedIp;

        // Dispatch to Queue for High Performance
        ProcessDeviceMetrics::dispatch($data);

        return response()->json(['status' => 'success']);
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

    public function getStatus()
    {
        return response()->json([
            'active' => \Illuminate\Support\Facades\Cache::get('monitoring_active', true)
        ]);
    }

    public function toggleStatus(Request $request)
    {
        $active = $request->input('active', true);
        \Illuminate\Support\Facades\Cache::forever('monitoring_active', $active);
        
        return response()->json(['success' => true, 'active' => $active]);
    }
}
