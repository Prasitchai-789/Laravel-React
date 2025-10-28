<?php

namespace App\Http\Controllers\Notifications;

use Telegram\Bot\Api;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class TelegramService extends Controller
{
    public function sendToTelegramTest($message)
    {
        $telegram = new Api(config('7730885419:AAFCoOo1lYKLUhmjc_6stegJl0FNLQnPcD4'));
        $chatId = -4778868443;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramFFB($message)
    {
        $telegram = new Api('7868619302:AAF2HzCr38jh_8lxL37FsTpjKcAxT0IDWck');
        $chatId = -4721803700;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramLoad($message)
    {
        $telegram = new Api('7975458636:AAEO5iSSC1V9gJ9DEtEef7Um6iIsmOaIaEw');
        $chatId = -4667395415 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramSales($message)
    {
        $telegram = new Api('7797769037:AAFQshadSXX7MvUBXcl9ktvIfQxw7sXFORk');
        $chatId = -4737025613 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramITE($message)
    {
        $telegram = new Api('7579608948:AAHSF6GbjI1mqF_YlcqmgNn7P0eiUFh-bpE');
        $chatId = -4723323365 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramMT($message)
    {
        $telegram = new Api('7828630375:AAHMFhQEO0jz6YoJ8-aOM6z_X3vfzG4HbQM');
        $chatId = -4727411984 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramCarRequest($message)
    {
        $telegram = new Api('7881990195:AAFz8qi7VRqTjeiS3Pvk5rRXwGGjOqYyKWw');
        $chatId = -4537055248 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramPassCar($message)
    {
        $telegram = new Api('7727097108:AAGqUpEAIjF9upJCxhSXrX01ibvOFXh14f0');
        $chatId = -4629180512 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramPROCount($message)
    {
        $telegram = new Api('7980130203:AAHNcVv8mXQf_Po6pndG9Z6CX9-0YfwDiEw');
        $chatId = -4705495902 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramDARRequest($message)
    {
        $telegram = new Api('7578266293:AAEliuzApJRAnGpdenTdfjNsVntftyLk1IU');
        $chatId = -4669248453 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramDAR($message)
    {
        $telegram = new Api('7839618642:AAEtzTdu1MeuYdAF9Rx1Mb84eZcouSIbNi4');
        $chatId = -4695191448 ;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramHRE($message)
    {
        $telegram = new Api('8032779836:AAHQVLlQcHHIq_M2jvrJ7pBKrKIb9RxPNOc');
        $chatId =  -4729570815;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramQMR($message)
    {
        $telegram = new Api('7256077525:AAE1rwothM9bHbC8eTNDbOEYGu_R8YYVJ-g');
        $chatId =  -4657031678;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramACC($message)
    {
        $telegram = new Api('8183230777:AAFBRt_w2jSph63BE_VkMCMxe1zDfuYhDjs');
        $chatId =  -4610724027;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramPRO($message)
    {
        $telegram = new Api('7820407091:AAHldXb_-3EJiMbGAdEy6CBLcK1jYZa5H-c');
        $chatId =  -4765805337;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramSEC($message)
    {
        $telegram = new Api('7562071225:AAED_PT8UcFKbfNpFNlDzti_PwP8WqOgCvw');
        $chatId =  -4721884511;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramRPO($message)
    {
        $telegram = new Api('7860083508:AAFdY1aEWiSWZAdLrcLlrS3PhnOXHup6T3k');
        $chatId =  -4788501485;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramPUR($message)
    {
        $telegram = new Api('7631676173:AAHFZ2cJHy4jz5t-rJgSDdrFo8JJskpKNCw');
        $chatId =  -4635502988;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramQAC($message)
    {
        $telegram = new Api('7737976520:AAExzGPkTLVusdvtBimIc3i8X2pQbt32BWk');
        $chatId =  -4714542380;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
    public function sendToTelegramMAR($message)
    {
        $telegram = new Api('7373117642:AAGeW9xMDQylD749Ansb8wAbglldNK13bPs');
        $chatId =  -4726289760;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

    public function sendToTelegramCOA($message)
    {
        $telegram = new Api('7758595144:AAFbgkQ3LyyP3QdLZeszsxfbrpOBttdswug');
        $chatId =  -4549872150;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }

     public function sendToTelegramFER($message)
    {
        $telegram = new Api('8219702884:AAEC2N4rrVSGSSsfKLmRbt-6RNzb4yg76U8');
        $chatId =  -1003147225934;

        $telegram->sendMessage([
            'chat_id' => $chatId,
            'text' => $message,
        ]);
    }
}
