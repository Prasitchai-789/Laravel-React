<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('memo_expense_documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_no', 50)->unique(); // เลขที่เอกสาร
            $table->date('date'); // วันที่เบิก
            $table->text('description')->nullable(); // รายละเอียด
            $table->foreignId('category_id')->constrained('memo_expense_categories')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('attachment_path')->nullable(); // สำหรับไฟล์แนบเดี่ยว
            $table->string('winspeed_ref_id', 50)->nullable(); // รหัสอ้างอิง Winspeed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memo_expense_documents');
    }
};
