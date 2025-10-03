<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleHasPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ตัวอย่างเพิ่ม role_id = 1 กับ permission_id = 1
        DB::table('role_has_permissions')->insert([
            'role_id' => 1,
            'permission_id' => 1,
        ]);

        // ถ้าต้องการเพิ่มหลาย permission ให้ใช้ loop
        // $permissions = [1, 2, 3];
        // foreach ($permissions as $permissionId) {
        //     DB::table('role_has_permissions')->insert([
        //         'role_id' => 1,
        //         'permission_id' => $permissionId,
        //     ]);
        // }
    }
}
