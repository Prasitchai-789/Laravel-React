<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\Task;
use App\Models\Milestone;
use App\Models\Comment;
use App\Models\File;
use App\Models\User;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        // สร้าง user สำหรับทดสอบ (ถ้ายังไม่มี)
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
            ]
        );

        // สร้าง Project ตัวอย่าง
        $project = Project::create([
            'name' => 'ระบบติดตามความคืบหน้าโครงการ',
            'description' => 'เว็บแอปจัดการโครงการและงานย่อย',
            'start_date' => now(),
            'end_date' => now()->addMonths(3),
            'status' => 'in_progress', // สมมติว่ามีค่า enum
        ]);

        // เพิ่ม Milestone
        $milestone1 = Milestone::create([
            'project_id' => $project->id,
            'name' => 'วางแผนโครงการ',
            'description' => 'เก็บ requirement และทำ ER Diagram',
            'due_date' => now()->addWeeks(1),
        ]);

        $milestone2 = Milestone::create([
            'project_id' => $project->id,
            'name' => 'พัฒนา Backend',
            'description' => 'สร้าง API ด้วย Laravel',
            'due_date' => now()->addWeeks(4),
        ]);

        // เพิ่ม Task
        $task1 = Task::create([
            'project_id' => $project->id,
            'name' => 'ออกแบบฐานข้อมูล',
            'description' => 'สร้าง migrations และ models',
            'status' => 'in_progress',
            'progress' => 50,
            'due_date' => now()->addDays(5),
        ]);

        $task2 = Task::create([
            'project_id' => $project->id,
            'name' => 'พัฒนา API ผู้ใช้',
            'description' => 'CRUD สำหรับ Users',
            'status' => 'pending',
            'progress' => 0,
            'due_date' => now()->addDays(10),
        ]);

        // เพิ่ม Comment
        Comment::create([
            'task_id' => $task1->id,
            'user_id' => $user->id,
            'content' => 'ฐานข้อมูลออกแบบเสร็จแล้ว รอทดสอบ',
        ]);

        Comment::create([
            'task_id' => $task2->id,
            'user_id' => $user->id,
            'content' => 'เริ่มพัฒนา API สัปดาห์หน้า',
        ]);

        // เพิ่ม File ให้ Project
        File::create([
            'fileable_id' => $project->id,
            'fileable_type' => Project::class,
            'file_path' => 'uploads/project_plan.pdf',
            'uploaded_by' => $user->id,
        ]);

        // เพิ่ม File ให้ Task
        File::create([
            'fileable_id' => $task1->id,
            'fileable_type' => Task::class,
            'file_path' => 'uploads/db_design.png',
            'uploaded_by' => $user->id,
        ]);
    }
}
