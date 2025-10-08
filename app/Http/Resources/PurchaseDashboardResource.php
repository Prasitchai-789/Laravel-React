<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'DeptID' => $this['DeptID'],
            'DeptName' => $this['DeptName'],
            'TotalAmount' => round($this['TotalAmount'], 2),
        ];
    }
}
