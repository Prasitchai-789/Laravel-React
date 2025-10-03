<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            "users.view",
            "users.edit",
            "users.delete",
            "users.create",
            "roles.view",
            "roles.edit",
            "roles.delete",
            "roles.create",

            "permission.view",
            "permission.edit",
            "permission.delete",
            "permission.create",
            "Admin.view",
            "Admin.edit",
            "Admin.delete",
            "Admin.create",
            "premission.view",
            "premission.edit",
            "premission.delete",
            "premission.create",


        ];

        // ✅ สร้าง permission ทั้งหมด
        foreach ($permissions as $value) {
            Permission::firstOrCreate(['name' => $value]);
        }

        // ✅ สร้าง role admin ถ้ายังไม่มี
        $adminRole = Role::firstOrCreate(['name' => 'admin']);

        // ✅ ให้ role admin ได้ทุก permission
        $adminRole->syncPermissions($permissions);
    }
}
