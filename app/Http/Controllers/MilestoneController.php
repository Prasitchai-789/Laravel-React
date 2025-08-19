<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Milestone;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
     public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date',
        ]);

        $milestone = $project->milestones()->create($validated);

        return redirect()->back()->with('success', 'Milestone created successfully');
    }

    /**
     * อัพเดท Milestone
     */
    public function update(Request $request, Project $project, Milestone $milestone)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date',
        ]);

        $milestone->update($validated);

        return redirect()->back()->with('success', 'Milestone updated successfully');
    }

    /**
     * ลบ Milestone
     */
    public function destroy(Project $project, Milestone $milestone)
    {
        $milestone->delete();

        return redirect()->back()->with('success', 'Milestone deleted successfully');
    }
}
