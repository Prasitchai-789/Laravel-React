<?php

namespace App\Services\Common;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send Line Notify Alert
     */
    public function sendLineNotify($message, $token = null)
    {
        $token = $token ?? config('services.line_notify.token');
        
        if (!$token) {
            Log::warning("Line Notify Token not configured. Message: " . $message);
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->asForm()->post('https://notify-api.line.me/api/notify', [
                'message' => $message,
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Line Notify Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Telegram Alert
     */
    public function sendTelegram($message, $botToken = null, $chatId = null)
    {
        $botToken = $botToken ?? config('services.telegram.bot_token');
        $chatId = $chatId ?? config('services.telegram.chat_id');

        if (!$botToken || !$chatId) {
            Log::warning("Telegram config missing. Message: " . $message);
            return false;
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML'
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Telegram Error: " . $e->getMessage());
            return false;
        }
    }
}
