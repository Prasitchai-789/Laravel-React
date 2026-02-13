<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

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

            "admin.view",
            "admin.edit",
            "admin.delete",
            "admin.create",

         
        ];

        // ✅ สร้าง permission ทั้งหมด
        foreach ($permissions as $value) {
            Permission::firstOrCreate(['name' => $value]);
        }

        // ✅ สร้าง role admin ถ้ายังไม่มี
        $adminRole = Role::firstOrCreate(['name' => 'admin']);

        // ✅ ให้ role admin ได้ทุก permission
        $adminRole->syncPermissions($permissions);

        // ✅ สร้างหรืออัปเดต User id=1
        $user = User::find(1);

        if (!$user) {
            $user = User::create([
                'id' => 1, // ✅ บังคับ id=1
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('12345678'), // ✅ ตั้งรหัสผ่าน
            ]);
        }

        // ✅ กำหนด role admin ให้ user id=1
        $user->assignRole($adminRole);
    }
}
