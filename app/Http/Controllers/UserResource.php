<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'   => $this->id,
            'name' => $this->name,

            'roles' => $this->roles->pluck('name'), // ถ้าจะส่ง role ไปด้วย

            'webapp_emp' => $this->whenLoaded('WebappEmp', function () {
                return [
                    'DeptID'   => $this->webapp_emp->DeptID ?? null,
                    'DeptName' => $this->webapp_emp->webDept->DeptName ?? null,
                ];
            }),
        ];
    }
}
