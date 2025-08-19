<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
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
        ];

        foreach ($permissions as $key => $value) {
            Permission::Create([
                'name' => $value
            ]);
        }
    }
}
