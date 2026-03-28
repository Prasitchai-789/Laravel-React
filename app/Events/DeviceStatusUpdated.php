<?php

namespace App\Events;

use App\Models\Device;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $device;

    public function __construct(Device $device)
    {
        $this->device = $device;
    }

    public function broadcastOn()
    {
        return new Channel('devices');
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->device->id,
            'status' => $this->device->status,
            'last_seen' => $this->device->last_seen ? $this->device->last_seen->toIso8601String() : null,
        ];
    }
}
