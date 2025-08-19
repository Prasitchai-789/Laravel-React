<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class TaskController extends Controller
{
   public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'required|string|in:not_started,in_progress,completed',
            'progress'    => 'required|integer|min:0|max:100',
            'due_date'    => 'nullable|date',
        ]);

        $task = $project->tasks()->create($validated);

        return redirect()->back()->with('success', 'Task created successfully');
    }

    /**
     * อัพเดท Task
     */
    public function update(Request $request, Project $project, Task $task)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'required|string|in:not_started,in_progress,completed',
            'progress'    => 'required|integer|min:0|max:100',
            'due_date'    => 'nullable|date',
        ]);

        $task->update($validated);

        return redirect()->back()->with('success', 'Task updated successfully');
    }
}
