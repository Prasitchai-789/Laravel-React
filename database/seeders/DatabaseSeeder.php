<?php

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // สร้าง User 10 คน
        // User::factory(10)->create();

        // Seeder อื่น ๆ
        // $this->call(ProjectSeeder::class);

        // user test ธรรมดา
        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        // $this->call(FertilizerSeeder::class);

        // ✅ สร้าง Role admin ถ้ายังไม่มี
        $adminRole = Role::firstOrCreate(['name' => 'admin']);

        // ✅ สร้าง user ที่เป็น admin
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('12345678'), // อย่าลืมเปลี่ยนทีหลัง
            ]
        );

        // ✅ Assign role ให้ user
        $adminUser->assignRole($adminRole);
    }
}

