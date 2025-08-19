<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Controllers\ProjectResource;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['tasks', 'milestones', 'files']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = $request->get('per_page', 10);
        $projects = $query->paginate($perPage);
        // ส่ง JSON ให้ React
        // return response()->json($projects);
        return Inertia::render('Projects/Index', [
            'projects' => ProjectResource::collection($projects),
        ]);
    }


    public function ProjectDetail($id)
    {
        $project = Project::with([
            'tasks',
            'milestones',
            'files'
        ])->find($id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }
        
        return Inertia::render('Projects/ProjectDetail', [
            'project' => new ProjectResource($project),
        ]);
    }
}
