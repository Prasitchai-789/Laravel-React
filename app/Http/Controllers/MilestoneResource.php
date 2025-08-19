<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class MilestoneResource extends JsonResource
{
     public function toArray($request)
    {
        return [
             'id'        => $this->id,
            'name'      => $this->name,
            'due_date'  => $this->due_date
        ];
    }
}
