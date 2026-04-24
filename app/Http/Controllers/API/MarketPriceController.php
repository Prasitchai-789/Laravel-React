<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExternalMarketPriceService;
use Illuminate\Http\Request;

class MarketPriceController extends Controller
{
    protected $marketPriceService;

    public function __construct(ExternalMarketPriceService $marketPriceService)
    {
        $this->marketPriceService = $marketPriceService;
    }

    /**
     * Get palm prices from external source
     */
    public function getPalmPrices()
    {
        $prices = $this->marketPriceService->getPalmPrices();
        
        return response()->json([
            'success' => true,
            'data' => $prices,
            'latest' => !empty($prices) ? end($prices) : null
        ]);
    }
}
