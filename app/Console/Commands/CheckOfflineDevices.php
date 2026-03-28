<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Alert;
use App\Events\DeviceStatusUpdated;
use Illuminate\Support\Facades\Http;

class CheckOfflineDevices extends Command
{
    protected $signature = 'devices:check-offline';
    protected $description = 'Check and mark devices as offline if last_seen > 2 minutes';

    public function handle()
    {
        $threshold = now()->subMinutes(2);

        $offlineDevices = Device::where('status', 'online')
            ->where('last_seen', '<', $threshold)
            ->get();

        /** @var \App\Models\Device $device */
        foreach ($offlineDevices as $device) {
            $device->update(['status' => 'offline']);
            
            // Create Alert
            Alert::create([
                'device_id' => $device->id,
                'type' => 'offline',
                'message' => "Device [{$device->name}] went offline.",
            ]);

            // Realtime Update
            event(new DeviceStatusUpdated($device));

            // Format message
            $lastSeenStr = $device->last_seen ? $device->last_seen->format('Y-m-d H:i:s') : 'Never';
            $message = "\n🚨 Device Offline\nName: {$device->name}\nIP: {$device->ip_address}\nLast Seen: {$lastSeenStr}";

            // Send via new reusable LINE Notify service
            $lineService = new \App\Services\LineNotifyService();
            $lineService->send($message);

            // Send via Telegram ITE as implied in requirements
            $telegramService = new \App\Http\Controllers\Notifications\TelegramService();
            $telegramService->sendToTelegramITE($message);
        }
    }
}
