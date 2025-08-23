<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class MilestoneResource extends JsonResource
{
    public function toArray($request)
    {
        $cleanDate = str_replace([':AM', ':PM'], [' AM', ' PM'], $this->due_date);
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'due_date'  => $cleanDate
                ? Carbon::parse($cleanDate)->format('Y-m-d')
                : null,
        ];
    }
}
