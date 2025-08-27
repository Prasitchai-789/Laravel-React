<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10); // จำนวนต่อหน้า, default 10

        $permissions = Permission::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('guard_name', 'like', "%{$search}%");
            })
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,  // ส่ง paginator ทั้งก้อน
        ]);
    }

    public function create()
    {
        return Inertia::render('Permissions/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name',
            'guard_name' => 'required|string',
        ]);

        $suffixes = ['view', 'create', 'edit', 'delete'];

        foreach ($suffixes as $suffix) {
            Permission::create([
                'name' => $request->name . '.' . $suffix,
                'guard_name' => $request->guard_name,
            ]);
        }

        return back()->with('success', 'Permissions created successfully!');
    }

    public function show($id)
    {
        $permission = Permission::findOrFail($id);
        return Inertia::render('Permissions/Show', [
            'permission' => $permission,
        ]);
    }

    public function edit($id)
    {
        $permission = Permission::findOrFail($id);
        return Inertia::render('Permissions/Edit', [
            'permission' => $permission,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|unique:permissions,name,' . $id,
            'guard_name' => 'required',
        ]);

        $permission = Permission::findOrFail($id);
        $permission->update([
            'name' => $request->name,
            'guard_name' => $request->guard_name,
        ]);

        return redirect()->route('permissions.index')
            ->with('success', 'Permission updated successfully!');
    }

    public function destroy($id)
    {
        Permission::destroy($id);

        return redirect()->route('permissions.index')
            ->with('success', 'Permission deleted successfully!');
    }
}
