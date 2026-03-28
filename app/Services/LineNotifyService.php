<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class LineNotifyService
{
    /**
     * Send a LINE Notify message
     * 
     * @param string $message
     * @return bool
     */
    public function send($message)
    {
        $token = env('LINE_NOTIFY_TOKEN');

        if (!$token) {
            return false;
        }

        $client = new Client();

        try {
            $response = $client->post('https://notify-api.line.me/api/notify', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ],
                'form_params' => [
                    'message' => $message,
                ]
            ]);

            return $response->getStatusCode() === 200;
        } catch (RequestException $e) {
            // Log error if needed: \Log::error('LINE Notify failed: ' . $e->getMessage());
            return false;
        }
    }
}
