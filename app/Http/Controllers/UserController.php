<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Users/Index', [
            'users' => User::with('roles')->get(),
            'roles' => Role::select('id', 'name')->get()->toArray(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Users/UseForm', [
            'roles' => Role::select('id', 'name')->get()->toArray(),
            'userRoles' => [],
            'mode' => 'create',
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name'
        ]);
        $user = User::create($request->only('name', 'email')
            +
            [
                'password' => Hash::make($request->password)
            ]);
        $user->syncRoles($request->roles);

        return redirect()->route('users.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Inertia::render('Users/Show', [
            'user' => User::find($id)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = User::with('roles')->findOrFail($id);
        return Inertia::render('Users/UseForm', [
            'user' => $user,
            'userRoles' => $user->roles()->pluck('name')->toArray(),
            'roles' => Role::select('id', 'name')->get()->toArray(),
            'mode' => 'edit',
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email,' . $id,
            'roles' => 'array',
            'roles.*' => 'exists:roles,name'
        ]);

        $user = User::find($id);

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        $user->syncRoles($request->roles);

        return redirect()->route('users.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        User::destroy($id);

        return redirect()->route('users.index');
    }
}
