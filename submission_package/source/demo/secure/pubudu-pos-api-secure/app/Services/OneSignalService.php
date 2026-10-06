<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OneSignalService
{
    public static function sendToAdmins(string $title, string $message, array $data = [])
    {
        try {
            Http::withHeaders([
                'Authorization' => 'Basic ' . config('services.onesignal.rest_api_key'),
                'Content-Type'  => 'application/json',
            ])->post('https://onesignal.com/api/v1/notifications', [
                'app_id' => config('services.onesignal.app_id'),

                // ✅ ONLY ADMINS
                'filters' => [
                    [
                        'field' => 'tag',
                        'key' => 'role',
                        'relation' => '=',
                        'value' => 'admin',
                    ],
                ],

                'headings' => ['en' => $title],
                'contents' => ['en' => $message],

                // Optional extra data
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('OneSignal error: ' . $e->getMessage());
        }
    }
    
    
    public static function sendToEmployee(
    string $userCode,
    string $title,
    string $message,
    array $data = []
) {
    try {
        \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => 'Basic ' . config('services.onesignal.rest_api_key'),
            'Content-Type'  => 'application/json',
        ])->post('https://onesignal.com/api/v1/notifications', [
            'app_id' => config('services.onesignal.app_id'),

            // 🎯 TARGET SPECIFIC EMPLOYEE
            'filters' => [
                [
                    'field' => 'tag',
                    'key' => 'user_code',
                    'relation' => '=',
                    'value' => $userCode,
                ],
            ],

            'headings' => ['en' => $title],
            'contents' => ['en' => $message],
            'data' => $data,
        ]);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error(
            'OneSignal employee notify error: ' . $e->getMessage()
        );
    }
}

}



