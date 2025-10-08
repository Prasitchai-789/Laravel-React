<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['tasks', 'milestones', 'comments', 'files']);
        // --- Search ---
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        // --- Filter (ตัวอย่าง: status) ---
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // --- Pagination ---
        $perPage = $request->get('per_page', 10);
        $projects = $query->paginate($perPage);

        return response()->json($projects);
    }

    public function show($id)
    {
        $project = Project::with(['tasks', 'milestones', 'comments', 'files'])->find($id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        return response()->json($project);
    }
}
