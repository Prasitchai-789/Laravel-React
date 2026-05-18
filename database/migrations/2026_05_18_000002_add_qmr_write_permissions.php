<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = ['qmr.edit', 'qmr.delete'];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        Role::whereIn('name', ['admin'])->get()->each(
            fn (Role $role) => $role->givePermissionTo($permissions)
        );
    }

    public function down(): void
    {
        Permission::whereIn('name', ['qmr.edit', 'qmr.delete'])->delete();
    }
};
