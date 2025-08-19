<?php

namespace App\Http\Controllers;

use Carbon\Carbon;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{

    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'status'      => $this->status,
            'owner'       => $this->owner,
            'score'       => $this->score,
            'start_date'  => $this->start_date,
            'end_date'    => $this->end_date,

            // Progress ของ Project (ค่าเฉลี่ย progress จาก tasks)
            'progress'    => $this->tasks->count() > 0
                ? round($this->tasks->avg('progress'))
                : 0,

            // ส่ง relations ไปด้วย (optional)
            'tasks'       => $this->tasks->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'progress' => $t->progress,
                'status' => $t->status,
                'description' => $t->description,
                'due_date' => $t->due_date
            ]),

            'milestones'  => $this->milestones->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'description' => $m->description,
                'due_date' => $m->due_date ,
            ]),

            'files'       => $this->files->map(fn($f) => [
                'id' => $f->id,
                'file_path' => $f->file_path,
                'uploaded_by' => $f->uploaded_by,
            ]),
        ];
    }
}
