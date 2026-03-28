<?php

namespace App\Jobs;

use App\Models\Device;
use App\Models\DeviceMetric;
use App\Events\DeviceStatusUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessDeviceMetrics implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function handle()
    {
        $device = Device::where('mac_address', $this->data['mac_address'])->first();

        if ($device) {
            $device->update([
                'status' => 'online',
                'last_seen' => now(),
            ]);

            DeviceMetric::create([
                'device_id' => $device->id,
                'cpu_usage' => $this->data['cpu'] ?? 0,
                'ram_usage' => $this->data['ram'] ?? 0,
                'disk_usage' => $this->data['disk'] ?? 0,
            ]);

            event(new DeviceStatusUpdated($device));
        }
    }
}
