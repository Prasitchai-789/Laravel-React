<?php

namespace App\Models\Memo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MemoExpenseAttachments extends Model
{
     use HasFactory;

    protected $table = 'memo_expense_attachments';
    protected $fillable = ['expense_id', 'file_name', 'file_path', 'mime_type'];

    /**
     * ความสัมพันธ์กลับไปยังเอกสาร
     */
    public function document()
    {
        return $this->belongsTo(MemoExpenseDocuments::class, 'expense_id');
    }
}
