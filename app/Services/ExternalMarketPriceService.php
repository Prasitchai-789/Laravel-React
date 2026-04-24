<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ExternalMarketPriceService
{
    protected $baseUrl = 'https://palmoilcity-plus.com';

    /**
     * Get palm prices and oil prices from Palmoilcity API
     * 
     * @return array
     */
    public function getPalmPrices()
    {
        return Cache::remember('external_palm_prices_api_v2', 3600, function () {
            try {
                $client = new Client([
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    ],
                    'timeout' => 60 // Large JSON needs more time
                ]);

                // 1. Fetch Palm Prices
                $palmResponse = $client->get($this->baseUrl . '/api/palm-prices');
                $palmRawData = json_decode($palmResponse->getBody()->getContents(), true);

                // 2. Fetch Oil (CPO) Prices
                $oilResponse = $client->get($this->baseUrl . '/api/dit-prices');
                $oilData = json_decode($oilResponse->getBody()->getContents(), true);

                if (!$palmRawData || !is_array($palmRawData)) {
                    return [];
                }

                // Limit data to last 180 days for performance
                $cutoffDate = date('Y-m-d', strtotime('-180 days'));

                // 3. Aggregate Palm Prices by Date
                $aggregatedPalm = [];
                foreach ($palmRawData as $item) {
                    $date = $item['priceDate'] ?? null;
                    if (!$date || $date < $cutoffDate) continue;

                    if (!isset($aggregatedPalm[$date])) {
                        $aggregatedPalm[$date] = [
                            'palm_min' => 999,
                            'palm_max' => 0,
                            'palm_sum' => 0,
                            'palm_count' => 0,
                        ];
                    }

                    $price = (float)$item['pricePerKg'];
                    $priceMax = (float)$item['priceMaxPerKg'];

                    if ($price < $aggregatedPalm[$date]['palm_min']) $aggregatedPalm[$date]['palm_min'] = $price;
                    if ($priceMax > $aggregatedPalm[$date]['palm_max']) $aggregatedPalm[$date]['palm_max'] = $priceMax;
                    
                    $aggregatedPalm[$date]['palm_sum'] += (($price + $priceMax) / 2);
                    $aggregatedPalm[$date]['palm_count']++;
                }

                // 4. Map Oil Prices by Date
                $oilLookup = [];
                if (is_array($oilData)) {
                    foreach ($oilData as $item) {
                        $date = $item['priceDate'];
                        if ($date < $cutoffDate) continue;
                        
                        $oilLookup[$date] = [
                            'oil_min' => (float)$item['priceMin'],
                            'oil_max' => (float)$item['priceMax'],
                            'oil_avg' => (float)$item['priceAvg'],
                        ];
                    }
                }

                // 5. Build Final Combined List
                $result = [];
                $dates = array_keys($aggregatedPalm);
                sort($dates);

                $thaiMonths = [
                    1 => 'ม.ค.', 2 => 'ก.พ.', 3 => 'มี.ค.', 4 => 'เม.ย.', 5 => 'พ.ค.', 6 => 'มิ.ย.',
                    7 => 'ก.ค.', 8 => 'ส.ค.', 9 => 'ก.ย.', 10 => 'ต.ค.', 11 => 'พ.ย.', 12 => 'ธ.ค.'
                ];

                foreach ($dates as $date) {
                    $palm = $aggregatedPalm[$date];
                    $oil = $oilLookup[$date] ?? [
                        'oil_min' => 0,
                        'oil_max' => 0,
                        'oil_avg' => 0,
                    ];

                    $dt = new \DateTime($date);
                    $day = (int)$dt->format('d');
                    $month = (int)$dt->format('m');
                    $year = (int)$dt->format('Y') + 543; // BE

                    $result[] = [
                        'date' => $date,
                        'day' => $day,
                        'month' => $month,
                        'year' => $year,
                        'month_name' => $thaiMonths[$month] ?? '',
                        'palm_min' => $palm['palm_min'] == 999 ? 0 : $palm['palm_min'],
                        'palm_max' => $palm['palm_max'],
                        'palm_avg' => $palm['palm_count'] > 0 ? round($palm['palm_sum'] / $palm['palm_count'], 2) : 0,
                        'oil_min' => $oil['oil_min'],
                        'oil_max' => $oil['oil_max'],
                        'oil_avg' => $oil['oil_avg'],
                    ];
                }

                return $result;
            } catch (\Exception $e) {
                Log::error('ExternalMarketPriceService API Error: ' . $e->getMessage());
                return [];
            }
        });
    }
}
