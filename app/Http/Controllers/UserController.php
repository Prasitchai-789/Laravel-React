<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\WIN\WebappEmp;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToArray;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with(['roles', 'WebappEmp'])->get();
        $roles = Role::select('id', 'name')->get()->toArray();
        $allEmployees = WebappEmp::select('EmpID', 'EmpName', 'EmpCode', 'Position', 'DeptID', 'Tel', 'Email', 'Address')
            ->get()
            ->toArray();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'allEmployees' => $allEmployees,
            'employees' => $allEmployees, // ส่งทั้งสองชื่อเพื่อความเข้ากันได้
        ]);
    }


    public function create()
    {
        return Inertia::render('Users/UseForm', [
            'roles' => Role::select('id', 'name')->get()->toArray(),
            'userRoles' => [],
            'mode' => 'create',
            'employees' => WebappEmp::select('EmpID', 'EmpName', 'EmpCode', 'Position', 'DeptID', 'Tel', 'Email', 'Address')
                ->get()
                ->toArray(),
        ]);
    }

    public function store(Request $request)
    {

        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
            'employee_id' => [
                'nullable',
                Rule::exists('sqlsrv2.dbo.Webapp_Emp', 'EmpID'),
            ],
        ]);

        try {
            DB::beginTransaction();

            $employeeId = $request->employee_id;

            // ถ้าไม่ได้เลือก employee_id ให้ลองหาเองจาก email
            if (!$employeeId) {
                $emp = WebappEmp::where('Email', $request->email)->first();
                if ($emp) {
                    $employeeId = $emp->EmpID;
                }
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'employee_id' => $employeeId,
                'password' => Hash::make($request->password),
            ]);

            $user->syncRoles($request->roles);

            DB::commit();

            return redirect()->route('users.index')->with('success', 'User created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error creating user: ' . $e->getMessage());
        }
    }



    public function show(string $id)
    {
        $user = User::with(['roles', 'webappEmp'])->findOrFail($id);
        // $user = User::with(['webappEmp.webDept'])->findOrFail($id);
        return Inertia::render('Users/Show', [
            'user' => new UserResource($user)
        ]);
    }

    public function edit(string $id)
    {
        $user = User::with(['roles', 'webappEmp'])->findOrFail($id);

        return Inertia::render('Users/UserForm', [
            'user' => $user,
            'roles' => Role::select('id', 'name')->get(),
            'userRoles' => $user->roles->pluck('name')->toArray(),
            'mode' => 'edit',
            'employees' => WebappEmp::select('EmpID', 'EmpName', 'EmpCode', 'Position', 'DeptID', 'Tel', 'Email', 'Address')->get(),
            'currentEmployee' => $user->webappEmp ? [
                'EmpID' => $user->webappEmp->EmpID,
                'EmpName' => $user->webappEmp->EmpName,
                'EmpCode' => $user->webappEmp->EmpCode,
                'Position' => $user->webappEmp->Position,
                'DeptID' => $user->webappEmp->DeptID,
                'Tel' => $user->webappEmp->Tel,
                'Email' => $user->webappEmp->Email,
                'Address' => $user->webappEmp->Address,
            ] : null,
        ]);
    }

    // Update user
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:8',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
            'employee_id' => [
                'nullable',
                Rule::exists('sqlsrv2.dbo.Webapp_Emp', 'EmpID'),
            ],
        ]);

        DB::beginTransaction();

        $user = User::findOrFail($id); // ถ้า id ไม่มี → 500

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        if (!is_null($request->employee_id)) {
            $updateData['employee_id'] = $request->employee_id;
        }

        DB::enableQueryLog();
        $user->update($updateData);

        $newRoles = $request->roles ?? [];
        $currentRoles = $user->getRoleNames()->toArray();

        if (!empty(array_diff($newRoles, $currentRoles)) || !empty(array_diff($currentRoles, $newRoles))) {
            $user->syncRoles($newRoles);
        }

        DB::commit();

        // Debug SQL
        // dd(DB::getQueryLog());

        if (!$user->wasChanged() && empty(array_diff($newRoles, $currentRoles))) {
            abort(500, 'No changes were made'); // ทำให้เกิด error 500
        }

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }





    public function destroy(string $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return redirect()->route('users.index')->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error deleting user: ' . $e->getMessage());
        }
    }

    public function getEmployees()
    {
        $employees = WebappEmp::select('EmpID', 'EmpName')
            ->orderBy('EmpName')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $employees
        ]);
    }
}
